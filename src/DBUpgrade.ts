import { setTimeout } from "node:timers/promises";
import { DbClient } from "./DbClient";
import { Logger } from "pino";
import { getLogger } from "./Logger";

/**
 * Configuration options for `UpgradeManager`.
 */
export type UpgradeManagerConfig = {
  /**
   * Optional suffix for version table name (defaults to `_version`).
   */
  version_table_suffix?: string;
};

/**
 * Manages database versioning and schema migrations.
 */
export class UpgradeManager {
  private readonly versionTable: string;
  private readonly client: DbClient;
  private readonly logger: Logger;
  private readonly defaultVersionTable = "_version";

  /**
   * Creates an instance of `UpgradeManager`.
   *
   * @param opts - Configuration object for version table customization.
   */
  constructor(opts?: UpgradeManagerConfig) {
    this.versionTable =
      this.defaultVersionTable + (opts?.version_table_suffix || "");
    this.logger = getLogger().child({ component: "mysql-migrator" });
    this.client = new DbClient();
  }

  /**
   * Checks the current database version and triggers init or upgrade.
   *
   * @param targetVersion - Desired schema version.
   * @param onSchemaInit - Callback to initialize schema.
   * @param onSchemaUpgrade - Callback to upgrade schema from previous version.
   */
  async checkDb(
    targetVersion: number,
    onSchemaInit: (dbClient: DbClient) => Promise<void>,
    onSchemaUpgrade: (dbClient: DbClient, from: number) => Promise<void>,
  ) {
    await this.client.open();

    let currentVersion = await this.loadCurrentVersion(targetVersion);

    if (currentVersion === true) return true;

    this.logger.info(
      "Check DB: currentVersion=%s targetVersion=%s",
      currentVersion,
      targetVersion,
    );

    if (currentVersion === -999) {
      currentVersion = await this.tryCreateVersionTable();
      if (currentVersion < 0) {
        await this.checkDb(targetVersion, onSchemaInit, onSchemaUpgrade);
        return;
      }
    } else if ((currentVersion as number) < 0) {
      this.logger.error("DB is initializing, exiting...");
      throw new Error("DB is initializing. Do not proceed.");
    }

    return this._checkAndMigrate(
      currentVersion as number,
      targetVersion,
      onSchemaInit,
      onSchemaUpgrade,
    );
  }

  /**
   * Gets the current schema version or state.
   *
   * @param targetVersion - The version being checked for equality.
   * @returns The current version number, `true` if already at target, or `false` if version table doesn't exist.
   */
  private async loadCurrentVersion(
    targetVersion: number,
  ): Promise<number | true | false> {
    try {
      const row = await this.readCurrentVersion(targetVersion);
      if (row === false) return -999;
      if (row === true) {
        this.logger.info("DB already at version %s", targetVersion);
        await this.client.close();
        return true;
      }
      return row.value;
    } catch (e: any) {
      this.logger.error(`Failed to read current version: ${e.message}`);
      throw e;
    }
  }

  /**
   * Reads the version table and checks for version match.
   *
   * @param targetVersion - Expected target version.
   * @returns Version row object, true if matches, or false if table not found.
   */
  private async readCurrentVersion(
    targetVersion: number,
  ): Promise<any | true | false> {
    const sql = `SELECT value FROM ${this.versionTable} FOR UPDATE`;
    await this.client.startTransaction();

    try {
      const row = await this.client.get(sql);
      if (!row) return false;

      this.logger.debug("Versions: db=%s target=%s", row.value, targetVersion);

      if (row.value === targetVersion) {
        this.logger.debug("Versions match. Rolling back...");
        await this.client.rollback();
        return true;
      }

      return row;
    } catch (e: any) {
      await this.client.rollback();

      if (e.code === "ER_NO_SUCH_TABLE") return false;

      this.logger.error("Unexpected DB error: %s (%s)", e.message, e.code);
      throw e;
    }
  }

  /**
   * Attempts to create the version table and initialize it with version -1.
   * Handles race condition during parallel initialization.
   */
  private async tryCreateVersionTable(): Promise<number> {
    try {
      return await this.createVersionTable();
    } catch (e: any) {
      if (e.code === "23505") {
        await this.client.close();
        await setTimeout(2000);
        return -1;
      }

      this.logger.error(
        `Unable to create ${this.versionTable} table: [${e.code}] ${e.message}`,
      );
      throw e;
    }
  }

  /**
   * Creates the version table and initializes it with -1.
   *
   * @returns `0` on success.
   */
  private async createVersionTable(): Promise<number> {
    const sql = `CREATE TABLE ${this.versionTable} (value INTEGER PRIMARY KEY)`;

    try {
      await this.client.query(sql);
    } catch (e) {
      await this.client.rollback();
      throw e;
    }

    try {
      await this.client.insert(`INSERT INTO ${this.versionTable} VALUES (-1)`);
      await this.client.get(
        `SELECT value FROM ${this.versionTable} FOR UPDATE`,
      );
    } catch (e: any) {
      this.logger.error(
        "Unable to insert initial version -1 in table %s: [%s] %s",
        this.versionTable,
        e.code,
        e.message,
      );
      throw e;
    }

    return 0;
  }

  /**
   * Performs schema initialization and updates the version.
   *
   * @param targetVersion - The target schema version.
   * @param onInit - Callback to run schema setup logic.
   */
  private async initializeSchema(
    targetVersion: number,
    onInit: (dbClient: DbClient) => Promise<void>,
  ) {
    const db = new DbClient();
    try {
      await db.open();
      await onInit(db);
      await this.updateVersion(targetVersion);
    } finally {
      await db.close();
    }
  }

  /**
   * Executes schema upgrade and version update.
   *
   * @param fromVersion - Current schema version.
   * @param targetVersion - Target schema version.
   * @param onUpgrade - Callback that performs upgrade logic.
   */
  private async upgradeSchema(
    fromVersion: number,
    targetVersion: number,
    onUpgrade: (dbClient: DbClient, from: number) => Promise<void>,
  ) {
    await onUpgrade(this.client, fromVersion);
    await this.updateVersion(targetVersion);
  }

  /**
   * Applies schema actions (init or upgrade) based on current version state.
   *
   * @returns `true` if handled successfully.
   */
  private async _checkAndMigrate(
    currentVersion: number,
    targetVersion: number,
    onSchemaInit: (dbClient: DbClient) => Promise<void>,
    onSchemaUpgrade: (dbClient: DbClient, from: number) => Promise<void>,
  ) {
    try {
      if (currentVersion === 0) {
        await this.initializeSchema(targetVersion, onSchemaInit);
        this.logger.info("Database schema initialized");
      } else if (targetVersion > currentVersion) {
        await this.upgradeSchema(
          currentVersion,
          targetVersion,
          onSchemaUpgrade,
        );
        this.logger.info(
          "Database schema upgraded to version %d",
          targetVersion,
        );
      }

      return true;
    } catch (e: any) {
      this.logger.error("\n\n !!!!!!!! FATAL MIGRATION ERROR !!!!!!!!\n\n");
      this.logger.error("checkDb failed: %s", e.message);
      this.logger.error(e.stack);
      throw e;
    } finally {
      await this.client.close();
    }
  }

  /**
   * Updates the version number in the version table and commits the transaction.
   *
   * @param targetVersion - Version number to persist.
   */
  private async updateVersion(targetVersion: number) {
    const sql = `UPDATE ${this.versionTable} SET value = ?`;
    await this.client.update(sql, [targetVersion]);
    await this.client.commit();
  }
}

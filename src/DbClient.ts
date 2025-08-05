import type { ConnectionOptions } from "mysql2";
import {
  createConnection,
  Connection,
  RowDataPacket,
  ResultSetHeader,
  ProcedureCallPacket,
  FieldPacket,
} from "mysql2/promise";
import {
  getMysqlConnectionOptions,
  USE_READ_COMMITTED_ISOLATION,
} from "./DBUtils";

/**
 * Extension of mysql2 `Connection` with a custom `run()` utility method.
 */
interface ConnectionWrap extends Connection {
  /**
   * Executes a SQL query with optional placeholders.
   *
   * @param sql - SQL query string.
   * @param phs - Optional array of parameter values.
   * @returns Promise resolving to query result and column metadata.
   */
  run<
    T extends
      | ResultSetHeader
      | ResultSetHeader[]
      | RowDataPacket[]
      | RowDataPacket[][]
      | ProcedureCallPacket,
  >(
    sql: string,
    phs?: (string | number | boolean | null)[],
  ): Promise<{
    rows: T;
    cols: FieldPacket[];
  }>;
}

/**
 * Lightweight MySQL client abstraction with built-in connection,
 * transaction, and utility methods.
 */
export class DbClient {
  private connection?: ConnectionWrap;
  private readonly connectionOptions: ConnectionOptions;

  /**
   * Constructs a new DbClient instance.
   *
   * @param connectionOptionsOrPrefix - A `ConnectionOptions` object or config prefix string.
   */
  constructor(connectionOptionsOrPrefix?: ConnectionOptions | string) {
    if (typeof connectionOptionsOrPrefix === "string") {
      this.connectionOptions = getMysqlConnectionOptions(
        connectionOptionsOrPrefix,
      );
    } else if (connectionOptionsOrPrefix) {
      this.connectionOptions = connectionOptionsOrPrefix;
    } else {
      this.connectionOptions = getMysqlConnectionOptions("");
    }
  }

  /**
   * Opens a new MySQL connection and enhances it with the `.run()` helper.
   */
  async open() {
    this.connection = (await createConnection(
      this.connectionOptions,
    )) as ConnectionWrap;

    this.connection.run = async <
      T extends
        | ResultSetHeader
        | ResultSetHeader[]
        | RowDataPacket[]
        | RowDataPacket[][]
        | ProcedureCallPacket,
    >(
      sql: string,
      phs?: (string | number | boolean | null)[],
    ): Promise<{ rows: T; cols: FieldPacket[] }> => {
      if (!this.connection) {
        throw new Error("run() called without an active connection");
      }
      const [rows, cols] = await this.connection.execute<T>(sql, phs);
      return { rows, cols };
    };
  }

  /**
   * Gets the underlying raw MySQL connection.
   */
  getConnection(): ConnectionWrap | undefined {
    return this.connection;
  }

  /**
   * Closes the MySQL connection if open.
   */
  async close() {
    if (this.connection) {
      await this.connection.end();
    }
  }

  /**
   * Starts a database transaction.
   * Optionally sets `READ COMMITTED` isolation level if configured.
   */
  async startTransaction() {
    if (!this.connection) {
      throw new Error("startTransaction() called without an active connection");
    }

    if (USE_READ_COMMITTED_ISOLATION) {
      await this.connection.execute(
        "SET SESSION tx_isolation='read-committed'",
      );
    }

    await this.connection.execute("SET AUTOCOMMIT=0");
  }

  /**
   * Commits the current transaction.
   *
   * @param closeTransaction - Whether to re-enable autocommit after commit (default: true).
   */
  async commit(closeTransaction = true) {
    if (!this.connection) {
      throw new Error("commit() called without an active connection");
    }

    await this.connection.execute("COMMIT");

    if (closeTransaction) {
      await this.connection.execute("SET AUTOCOMMIT=1");
    }
  }

  /**
   * Rolls back the current transaction.
   *
   * @param closeTransaction - Whether to re-enable autocommit after rollback (default: true).
   */
  async rollback(closeTransaction = true) {
    if (!this.connection) {
      throw new Error("rollback() called without an active connection");
    }

    await this.connection.execute("ROLLBACK");

    if (closeTransaction) {
      await this.connection.execute("SET AUTOCOMMIT=1");
    }
  }

  /**
   * Executes a query and returns all resulting rows.
   *
   * @param sql - SQL query string.
   * @param phs - Optional parameters for placeholders.
   * @returns Array of row objects.
   */
  async all(sql: string, phs?: (string | number | boolean | null)[]) {
    if (!this.connection) {
      throw new Error("all() called without an active connection");
    }

    const res = await this.connection.run<RowDataPacket[]>(sql, phs);
    return res.rows;
  }

  /**
   * Executes a query expecting exactly one or zero rows.
   *
   * @param sql - SQL query string.
   * @param phs - Optional parameter values.
   * @returns A single row object or null.
   * @throws If more than one row is returned.
   */
  async get(
    sql: string,
    phs?: (string | number | boolean | null)[],
  ): Promise<RowDataPacket | null> {
    if (!this.connection) {
      throw new Error("get() called without an active connection");
    }

    const res = await this.connection.run<RowDataPacket[]>(sql, phs);
    if (res.rows.length > 1) {
      throw new Error("get() returned more than one row");
    }

    return res.rows.length === 1 ? res.rows[0] : null;
  }

  /**
   * Executes an INSERT query.
   *
   * @param sql - SQL insert query.
   * @param phs - Optional values for placeholders.
   * @returns The insert ID or affected row count.
   */
  async insert(sql: string, phs?: (string | number | boolean | null)[]) {
    if (!this.connection) {
      throw new Error("insert() called without an active connection");
    }

    const res = await this.connection.run<ResultSetHeader>(sql, phs);
    return res.rows.insertId || res.rows.affectedRows;
  }

  /**
   * Executes an UPDATE query.
   *
   * @param sql - SQL update query.
   * @param phs - Optional parameters.
   * @param returnChangedRows - If true, returns changed rows instead of affected rows.
   * @returns Number of rows affected or changed.
   */
  async update(
    sql: string,
    phs?: (string | number | boolean | null)[],
    returnChangedRows = false,
  ) {
    if (!this.connection) {
      throw new Error("update() called without an active connection");
    }

    const res = await this.connection.run<ResultSetHeader>(sql, phs);
    return returnChangedRows ? res.rows.changedRows : res.rows.affectedRows;
  }

  /**
   * Executes a DELETE query.
   *
   * @param sql - SQL delete query.
   * @param phs - Optional parameters.
   * @returns Number of rows deleted.
   */
  async delete(sql: string, phs?: (string | number | boolean | null)[]) {
    if (!this.connection) {
      throw new Error("delete() called without an active connection");
    }

    const res = await this.connection.run<ResultSetHeader>(sql, phs);
    return res.rows.affectedRows;
  }

  /**
   * Executes a raw SQL query using `connection.execute()`.
   *
   * @param sql - SQL query string.
   * @param phs - Optional placeholder values.
   * @returns Raw result from mysql2.
   */
  async query(sql: string, phs?: (string | number | boolean | null)[]) {
    if (!this.connection) {
      throw new Error("executeRaw() called without an active connection");
    }

    return this.connection.execute(sql, phs);
  }
}

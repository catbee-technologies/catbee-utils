/**
 * Builder for multipart/form-data payloads.
 */
export class MultipartBuilder {
  private readonly form = new FormData();

  /**
   * Append a field to the multipart form.
   * @param name Field name.
   * @param value Field value; primitives are converted to strings.
   */
  public append(name: string, value: string | number | boolean | Blob): this {
    this.form.append(name, value instanceof Blob ? value : String(value));

    return this;
  }

  /**
   * Append a file field to the multipart form.
   * @param name Field name.
   * @param file File blob to append.
   * @param filename Optional file name to include in the multipart metadata.
   */
  public appendFile(name: string, file: Blob, filename?: string): this {
    this.form.append(name, file, filename);

    return this;
  }

  /**
   * Build and return the FormData instance.
   */
  public build(): FormData {
    return this.form;
  }
}

/** Only a missing kg_report RPC can select the old screen. Do not hide auth,
 * network, missing-table, or failures inside an installed function. PGRST202
 * also covers a function not yet reflected in PostgREST's schema cache. */
export function isKgReportUnavailable(error: {
  code?: string;
  message?: string;
}): boolean {
  const message = error.message || "";
  return (
    (error.code === "PGRST202" &&
      /Could not find the function public\.kg_report(?:\(\)|\s)/i.test(
        message,
      )) ||
    (error.code === "42883" &&
      /function public\.kg_report\(\) does not exist/i.test(message))
  );
}

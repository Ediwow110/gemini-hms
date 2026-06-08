// Shim to resolve recharts default import of es-toolkit/compat/get
// since es-toolkit only exports 'get' as a named export from compat.
import { get } from 'es-toolkit/compat';
export default get;

import axios from 'axios';

interface IJsonRpcSpecRequestBody {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params: Array<any>;
}

/**
 *
 * @param url RPC endpoint
 * @param body The JSON RPC request body. Must meet JSON RPC spec: https://www.jsonrpc.org/specification
 */
const request = (url: string, body: IJsonRpcSpecRequestBody): Promise<any> => {
  return new Promise((resolve, reject) => {
    axios.post(url, body).then(res => {
      if (typeof res.data.result !== 'undefined' || !!res.data.result)
        resolve(res.data.result);
      else if (!!res.data.error)
        reject(new Error(res.data.error.message || res.data.error));
    });
  });
};

export default request;

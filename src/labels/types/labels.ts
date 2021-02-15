export interface TLabelReqObject {
  name: string;
  new_name?: string;
  color?: string;
  description: string | null;
}
export interface ILabel extends TLabelReqObject {
  id: number;
  node_id: string;
  url: string;
  default: boolean;
}
export interface IOctoLabelParams {
  label: TLabelReqObject;
  readonly repo: string;
  readonly owner: string;
}

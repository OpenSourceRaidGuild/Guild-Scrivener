export interface TPayload {
  action: string;
  label: Readonly<ILabel>;
  organization: {
    login: string;
  };
}

export interface TLabelReqObject {
  name: string;
  new_name?: string;
  color?: string;
  description?: string;
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

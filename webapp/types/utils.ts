export type Dict<T = any> = { [key: string]: T };

export interface Product {
  DeleteId: string;
  SoLuong: number;
  NhaMay: string;
  MaPO: string;
  DateUpdate: string;
  MaPr: string;
}

export interface ProductData {
  ProductCollection: Product[];
}

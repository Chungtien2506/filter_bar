import UI5Date from "sap/ui/core/date/UI5Date";
import UI5Element from "sap/ui/core/Element";
import Filter from "sap/ui/model/Filter";

export type Dict<T = any> = { [key: string]: T };

export interface FilterValues {
  startDate: Date | UI5Date;
  enddate: Date | UI5Date;
  search: string;
  deleteId: string[];
}

export interface Filter1 {
  filter: Filter[];
  inputValues: Dict;
}


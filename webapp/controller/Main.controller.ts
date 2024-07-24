/* eslint-disable @typescript-eslint/unbound-method */
import Controller from "sap/ui/core/mvc/Controller";
import FilterBar, {
  FilterBar$FilterChangeEventParameters,
} from "sap/ui/comp/filterbar/FilterBar";
import JSONModel from "sap/ui/model/json/JSONModel";
import DatePicker from "sap/m/DatePicker";
import SearchField from "sap/m/SearchField";
import MultiComboBox from "sap/m/MultiComboBox";
import { Filter1 } from "projecttest/types/type";
import PersonalizableInfo from "sap/ui/comp/smartvariants/PersonalizableInfo";
import SmartVariantManagement from "sap/ui/comp/smartvariants/SmartVariantManagement";
import Label from "sap/m/Label";
import FilterGroupItem from "sap/ui/comp/filterbar/FilterGroupItem";
import UI5Date from "sap/ui/core/date/UI5Date";

export default class Main extends Controller {
  private filterBar: FilterBar;
  private table: any;

  private smartVariantManagement: SmartVariantManagement;
  private expandedLabel: Label;
  private snappedLabel: Label;

  public onInit(): void {
    this.filterBar = <FilterBar>this.byId("filterbar");
    this.table = this.byId("table");
    this.smartVariantManagement = <SmartVariantManagement>(
      this.getView()?.byId("svm")
    );

    this.expandedLabel = <Label>this.getView()?.byId("expandedLabel");
    this.snappedLabel = <Label>this.getView()?.byId("snappedLabel");

    this.applyData = this.applyData.bind(this);
    this.fetchData = this.fetchData.bind(this);
    this.getFiltersWithValues = this.getFiltersWithValues.bind(this);

    this.filterBar.registerFetchData(this.fetchData);
    this.filterBar.registerApplyData(this.applyData);
    this.filterBar.registerGetFiltersWithValues(this.getFiltersWithValues);

    let persInfo = new PersonalizableInfo({
      type: "filterBar",
      keyName: "persistencyKey",
      dataSource: "",
      control: this.filterBar,
    });

    this.smartVariantManagement.addPersonalizableControl(persInfo);
    this.smartVariantManagement.initialise(function () {}, this.filterBar);
  }

  public onSearch(): void {
    const { filter, inputValues } = this.filterBar
      .getFilterGroupItems()
      .reduce<Filter1>(
        (acc, filterGroupItem) => {
          const control = filterGroupItem.getControl();
          const name = filterGroupItem.getName();
          if (control?.isA<DatePicker>("sap.m.DatePicker")) {
            const valueDate = control.getDateValue();
            acc.inputValues[name] = valueDate;
          } else if (control?.isA<SearchField>("sap.m.SearchField")) {
            const valueSearch = control.getValue();
            acc.inputValues[name] = valueSearch;
          } else if (control?.isA<MultiComboBox>("sap.m.MultiComboBox")) {
            const aSelectedKeys = control.getSelectedKeys();
            acc.inputValues[name] = aSelectedKeys;
          }
          return acc;
        },
        { filter: [], inputValues: {} }
      );

    console.log(inputValues);
  }

  public updateLabelsAndTable(): void {
    this.expandedLabel.setText(this.getFormattedSummaryText());
    this.snappedLabel.setText(this.getFormattedSummaryText());
    this.table.setShowOverlay(false);
  }

  public getFormattedSummaryText(): string {
    let filtersWithValues = this.filterBar.retrieveFiltersWithValues();
    if (filtersWithValues.length === 0) {
      return "No filters active";
    }

    if (filtersWithValues.length === 1) {
      return (
        filtersWithValues.length +
        " filter active: " +
        filtersWithValues.join(", ")
      );
    }

    return (
      filtersWithValues.length +
      " filters active: " +
      filtersWithValues.join(", ")
    );
  }

  public getFormattedSummaryTextExpanded(): string {
    let aFiltersWithValues = this.filterBar.retrieveFiltersWithValues();

    if (aFiltersWithValues.length === 0) {
      return "No filters active";
    }

    let sText = aFiltersWithValues.length + " filters active",
      aNonVisibleFiltersWithValues =
        // @ts-ignore
        this.filterBar.retrieveNonVisibleFiltersWithValues();

    if (aFiltersWithValues.length === 1) {
      sText = aFiltersWithValues.length + " filter active";
    }

    if (
      aNonVisibleFiltersWithValues &&
      aNonVisibleFiltersWithValues.length > 0
    ) {
      sText += " (" + aNonVisibleFiltersWithValues.length + " hidden)";
    }

    return sText;
  }

  public onFilterChange(): void {
    this.updateLabelsAndTable();
    console.log(this.onFilterChange);
  }

  public onAfterVariantLoad(): void {
    this.updateLabelsAndTable();
    console.log(this.onAfterRendering);
  }

  public getFiltersWithValues(): FilterGroupItem[] {
    const aFiltersWithValue = this.filterBar
      .getFilterGroupItems()
      .reduce<FilterGroupItem[]>((aResult, filterGroupItem) => {
        const control = filterGroupItem.getControl();

        if (
          control?.isA<MultiComboBox>("sap.m.MultiComboBox") &&
          control.getSelectedKeys().length > 0
        ) {
          aResult.push(filterGroupItem);
        } else if (
          control?.isA<DatePicker>("sap.m.DatePicker") &&
          control.getDateValue() !== null
        ) {
          aResult.push(filterGroupItem);
        } else if (
          control?.isA<SearchField>("sap.m.SearchField") &&
          control.getValue() !== ""
        ) {
          aResult.push(filterGroupItem);
        }

        return aResult;
      }, []);

    return aFiltersWithValue;
  }

  public onSelectionChange(event: FilterBar$FilterChangeEventParameters): void {
    this.smartVariantManagement.currentVariantSetModified(true);
    this.filterBar.fireFilterChange(event);
  }

  public fetchData(): {
    groupName: string;
    fieldName: string;
    fieldData: string[];
  }[] {
    return this.filterBar
      .getAllFilterItems(true)
      .reduce<{ groupName: string; fieldName: string; fieldData: string[] }[]>(
        (aResult, oFilterItem) => {
          aResult.push({
            groupName: oFilterItem.getGroupName(),
            fieldName: oFilterItem.getName(),
            fieldData: oFilterItem.getControl().getSelectedKeys(),
          });
          return aResult;
        },
        []
      );
  }

  public applyData(
    aData: {
      groupName: string;
      fieldName: string;
      fieldData: string | Date | UI5Date | string[];
    }[]
  ): void {
    aData.forEach((oDataObject) => {
      const control = this.filterBar.determineControlByName(
        oDataObject.fieldName,
        oDataObject.groupName
      );
      if (control?.isA<DatePicker>("sap.m.DatePicker")) {
        control.setDateValue(oDataObject.fieldData as Date | UI5Date);
      } else if (control?.isA<SearchField>("sap.m.SearchField")) {
        control.setValue(oDataObject.fieldData as string);
      } else if (control?.isA<MultiComboBox>("sap.m.MultiComboBox")) {
        control.setSelectedKeys(oDataObject.fieldData as string[]);
      }
    });
  }
}

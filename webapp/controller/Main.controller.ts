import ComboBox from "sap/m/ComboBox";
import DatePicker from "sap/m/DatePicker";
import Input from "sap/m/Input";
import Label from "sap/m/Label";
import MultiComboBox from "sap/m/MultiComboBox";
import Select from "sap/m/Select";
import FilterBar, {
  FilterBar$FilterChangeEventParameters,
} from "sap/ui/comp/filterbar/FilterBar";
import FilterGroupItem from "sap/ui/comp/filterbar/FilterGroupItem";
import PersonalizableInfo from "sap/ui/comp/smartvariants/PersonalizableInfo";
import SmartVariantManagement from "sap/ui/comp/smartvariants/SmartVariantManagement";
import JSONModel from "sap/ui/model/json/JSONModel";
import Table from "sap/ui/table/Table";
import { FilterData } from "../types/filter";
import { Dict } from "../types/utils";
import Base from "./Base.controller";

export default class Main extends Base {
  private svm: SmartVariantManagement;
  private expandedLable: Label;
  private snappedLabel: Label;
  private filterBar: FilterBar;
  private table: Table;

  public onInit(): void {
    this.svm = this.getControlById("svm");
    this.expandedLable = this.getControlById("expandedLable");
    this.snappedLabel = this.getControlById("snappedLabel");
    this.filterBar = this.getControlById("filterbar");
    this.table = this.getControlById("table");
    const abc = {
      ProductCollection: [
        {
          MaPr: "1239102",
          DeleteId: "Power Projector 4713",
          SoLuong: "Projector",
          NhaMay: "Titanium",
          MaPO: "12345",
          Details: "chi tiet",
          DateUpdate: "1/1/2001",
        },
        {
          MaPr: "1239102",
          DeleteId: "Power Projector 4713",
          SoLuong: "Projector",
          NhaMay: "Titanium",
          MaPO: "12345",
          Details: "chi tiet",
          DateUpdate: "1/1/2001",
        },
        {
          MaPr: "1239102",
          DeleteId: "Power Projector 4713",
          SoLuong: "Projector",
          NhaMay: "Titanium",
          MaPO: "12345",
          Details: "chi tiet",
          DateUpdate: "1/1/2001",
        },
        {
          MaPr: "1239102",
          DeleteId: "Power Projector 4713",
          SoLuong: "Projector",
          NhaMay: "Titanium",
          MaPO: "12345",
          Details: "chi tiet",
          DateUpdate: "1/1/2001",
        },
        {
          MaPr: "1239102",
          DeleteId: "Power Projector 4713",
          SoLuong: "Projector",
          NhaMay: "Titanium",
          MaPO: "12345",
          Details: "chi tiet",
          DateUpdate: "1/1/2001",
        },
        {
          MaPr: "1239102",
          DeleteId: "Power Projector 4713",
          SoLuong: "Projector",
          NhaMay: "Titanium",
          MaPO: "12345",
          Details: "chi tiet",
          DateUpdate: "1/1/2001",
        },
        {
          MaPr: "1239102",
          DeleteId: "Power Projector 4713",
          SoLuong: "Projector",
          NhaMay: "Titanium",
          MaPO: "12345",
          Details: "chi tiet",
          DateUpdate: "1/1/2001",
        },
        {
          MaPr: "1239102",
          DeleteId: "Power Projector 4713",
          SoLuong: "Projector",
          NhaMay: "Titanium",
          MaPO: "12345",
          Details: "chi tiet",
          DateUpdate: "1/1/2001",
        },
        {
          MaPr: "1239102",
          DeleteId: "Power Projector 4713",
          SoLuong: "Projector",
          NhaMay: "Titanium",
          MaPO: "12345",
          Details: "chi tiet",
          DateUpdate: "1/1/2001",
        },
        {
          MaPr: "1239102",
          DeleteId: "Power Projector 4713",
          SoLuong: "Projector",
          NhaMay: "Titanium",
          MaPO: "12345",
          Details: "chi tiet",
          DateUpdate: "1/1/2001",
        },
        {
          MaPr: "1239102",
          DeleteId: "Power Projector 4713",
          SoLuong: "Projector",
          NhaMay: "Titanium",
          MaPO: "12345",
          Details: "chi tiet",
          DateUpdate: "1/1/2001",
        },
        {
          MaPr: "1239102",
          DeleteId: "Power Projector 4713",
          SoLuong: "Projector",
          NhaMay: "Titanium",
          MaPO: "12345",
          Details: "chi tiet",
          DateUpdate: "1/1/2001",
        },
      ],
    };

    const dataModel = new JSONModel(abc);
    this.getView()?.setModel(dataModel);

    this.filterBar.registerFetchData(this.fetchData);
    this.filterBar.registerApplyData(this.applyData);
    this.filterBar.registerGetFiltersWithValues(this.getFiltersWithValues);

    this.svm.addPersonalizableControl(
      new PersonalizableInfo({
        type: "filterbar",
        keyName: "persistencyKey",
        dataSource: "",
        control: this.filterBar,
      })
    );
    this.svm.initialise(() => {}, this.filterBar);
  }

  private fetchData = () => {
    return this.filterBar
      .getAllFilterItems(false)
      .reduce<FilterData[]>((acc, item: FilterGroupItem) => {
        const control = item.getControl();

        if (!control) {
          return acc;
        }

        const fieldName = item.getName();
        const groupName = item.getGroupName();

        let fieldData: string | string[] = "";

        if (control.isA<MultiComboBox>("sap.m.MultiComboBox")) {
          fieldData = control.getSelectedKeys();
        } else if (
          control.isA<ComboBox | Select>(["sap.m.ComboBox", "sap.m.Select"])
        ) {
          fieldData = control.getSelectedKey();
        } else if (control.isA<DatePicker>("sap.m.DatePicker")) {
          fieldData = control.getValue();
        } else if (control.isA<Input>("sap.m.Input")) {
          fieldData = control.getValue();
        }

        acc.push({
          groupName,
          fieldName,
          fieldData,
        });

        return acc;
      }, []);
  };

  private applyData = (data: unknown) => {
    (<FilterData[]>data).forEach((item) => {
      const { groupName, fieldName, fieldData } = item;

      const control = this.filterBar.determineControlByName(
        fieldName,
        groupName
      );

      if (control.isA<MultiComboBox>("sap.m.MultiComboBox")) {
        control.setSelectedKeys(<string[]>fieldData);
      } else if (
        control.isA<ComboBox | Select>(["sap.m.ComboBox", "sap.m.Select"])
      ) {
        control.setSelectedKey(<string>fieldData);
      } else if (control.isA<DatePicker>("sap.m.DatePicker")) {
        control.setValue(<string>fieldData);
      } else if (control.isA<Input>("sap.m.Input")) {
        control.setValue(<string>fieldData);
      }
    });
  };

  private getFiltersWithValues = () => {
    return this.filterBar
      .getFilterGroupItems()
      .reduce<FilterGroupItem[]>((acc, item) => {
        const control = item.getControl();

        if (!control) {
          return acc;
        }

        if (
          control.isA<MultiComboBox>("sap.m.MultiComboBox") &&
          control.getSelectedKeys().length
        ) {
          acc.push(item);
        } else if (
          control.isA<ComboBox | Select>(["sap.m.ComboBox", "sap.m.Select"]) &&
          control.getSelectedKey()
        ) {
          acc.push(item);
        } else if (
          control.isA<DatePicker>("sap.m.DatePicker") &&
          control.getValue()
        ) {
          acc.push(item);
        } else if (control?.isA<Input>("sap.m.Input") && control.getValue()) {
          acc.push(item);
        }

        return acc;
      }, []);
  };

  public onFieldChange(event: FilterBar$FilterChangeEventParameters) {
    this.svm.currentVariantSetModified(true);
    this.filterBar.fireFilterChange(event);
  }

  public onFilterChange() {
    this.updateLabelsAndTable();
  }

  public onAfterVariantLoad() {
    this.updateLabelsAndTable();
  }

  private updateLabelsAndTable() {
    const expandedText =
      this.filterBar.retrieveFiltersWithValuesAsTextExpanded();
    const snappedText = this.filterBar.retrieveFiltersWithValuesAsText();

    this.expandedLable.setText(expandedText);
    this.snappedLabel.setText(snappedText);
    this.table.setShowOverlay(true);
  }

  public onSearch() {
    const values = this.filterBar
      .getFilterGroupItems()
      .reduce<Dict>((acc, item) => {
        const name = item.getName();
        const control = item.getControl();

        if (!control) {
          return acc;
        }

        if (control.isA<MultiComboBox>("sap.m.MultiComboBox")) {
          acc[name] = control.getSelectedKeys();
        } else if (
          control.isA<ComboBox | Select>(["sap.m.ComboBox", "sap.m.Select"])
        ) {
          acc[name] = control.getSelectedKey();
        } else if (control.isA<DatePicker>("sap.m.DatePicker")) {
          acc[name] = control.getValue();
        } else if (control.isA<Input>("sap.m.Input")) {
          acc[name] = control.getValue();
        }

        return acc;
      }, {});

    console.log(values);
  }
}

import type { Button$PressEvent } from "sap/m/Button";
import ComboBox from "sap/m/ComboBox";
import DatePicker from "sap/m/DatePicker";
import Dialog, {
  Dialog$BeforeOpenEvent,
  type Dialog$AfterCloseEvent,
} from "sap/m/Dialog";
import Input from "sap/m/Input";
import InputBase, { type InputBase$ChangeEvent } from "sap/m/InputBase";
import Label from "sap/m/Label";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import MultiComboBox from "sap/m/MultiComboBox";
import type { ObjectIdentifier$TitlePressEvent } from "sap/m/ObjectIdentifier";
import Select from "sap/m/Select";
import FilterBar, {
  type FilterBar$FilterChangeEventParameters,
} from "sap/ui/comp/filterbar/FilterBar";
import FilterGroupItem from "sap/ui/comp/filterbar/FilterGroupItem";
import PersonalizableInfo from "sap/ui/comp/smartvariants/PersonalizableInfo";
import SmartVariantManagement from "sap/ui/comp/smartvariants/SmartVariantManagement";
import type Control from "sap/ui/core/Control";
import { ValueState } from "sap/ui/core/library";
import JSONModel from "sap/ui/model/json/JSONModel";
import type Row from "sap/ui/table/Row";
import type { RowActionItem$PressEvent } from "sap/ui/table/RowActionItem";
import Table from "sap/ui/table/Table";
import { MODEL_DATA } from "../constant/model";

import type { FilterData } from "../types/filter";
import type { Dict, Product } from "../types/utils";
import Base from "./Base.controller";
import Component from "projecttest/Component";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import { ODataSuccessResponse } from "projecttest/types/odata";
import { Employee } from "projecttest/types/page/employee";
import { Link$PressEvent } from "sap/m/Link";
import FileUploader from "sap/ui/unified/FileUploader";

export default class Main extends Base {
  private svm: SmartVariantManagement;
  private expandedLabel: Label;
  private snappedLabel: Label;
  private filterBar: FilterBar;
  private table: Table;
  private addProductDialog?: Dialog;
  private productDetailDialog?: Dialog;
  private editProductDialog?: Dialog;
  private component: Component;
  private fileUploader?: FileUploader;

  public onInit(): void {
    this.svm = this.getControlById("svm");
    this.expandedLabel = this.getControlById("expandedLabel");
    this.snappedLabel = this.getControlById("snappedLabel");
    this.filterBar = this.getControlById("filterbar");
    this.table = this.getControlById("table");
    this.component = <Component>this.getOwnerComponent();

    this.setModel(
      new JSONModel({
        currency: "VND",
      }),
      "view"
    );

    this.setModel(
      new JSONModel({
        ProductNames: MODEL_DATA.ProductNames,
        ProductCategories: MODEL_DATA.ProductCategories,
        ProductSuppliers: MODEL_DATA.ProductSuppliers,
      }),
      "searchHelp"
    );
    this.setModel(
      new JSONModel({
        rows: MODEL_DATA.ProductCollection,
      }),
      "table"
    );
    this.setModel(new JSONModel({}), "form");

    this.filterBar.registerFetchData(this.fetchData);
    this.filterBar.registerApplyData(this.applyData);
    this.filterBar.registerGetFiltersWithValues(this.getFiltersWithValues);

    this.svm.addPersonalizableControl(
      new PersonalizableInfo({
        type: "filterBar",
        keyName: "persistencyKey",
        dataSource: "",
        control: this.filterBar,
      })
    );
    this.svm.initialise(() => {}, this.filterBar);

    this.onFetchData();
  }

  public onOpenFile(oEvent: Link$PressEvent): void {
    // Lấy URL hoặc đường dẫn từ thuộc tính 'text' của Link
    const sFileUrl = oEvent.getSource().getText();

    // Mở tệp tin trong một tab mới
    window.open(sFileUrl, "_blank");
  }

  // lấy dữ liệu
  private onFetchData() {
    const tableMode = this.getModel("table");
    const oDataModel = <ODataModel>this.component.getModel();
    this.table.setBusy(true);

    oDataModel.read("/EmployeeSet", {
      success: (reponse: ODataSuccessResponse<Employee>) => {
        tableMode.setProperty("/rows", reponse.results);
        this.table.setBusy(false);
      },
      error: (error: Error) => {
        this.table.setBusy(false);
        console.log(error);
      },
    });
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

    this.expandedLabel.setText(expandedText);
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
  }

  // add product
  public async onOpenAddProduct() {
    if (!this.addProductDialog) {
      this.addProductDialog = <Dialog>await this.loadFragment({
        name: "projecttest.view.fragments.AddProduct",
      });
    }

    // Lấy mô hình form và thiết lập dữ liệu mặc định nếu cần
    const formModel = this.getModel("form");
    formModel.setData({}); // Reset dữ liệu trong form nếu cần

    this.addProductDialog.bindElement("form>/");
    this.fileUploader = <FileUploader>this.byId("fileUploader");
    this.addProductDialog.open();
  }

  public onAddProduct() {
    const oDataModel = <ODataModel>this.getView()?.getModel(); // Lấy mô hình OData
    const dialog = <Dialog>this.addProductDialog; // Dialog chứa form thêm sản phẩm
    const formModel = this.getModel("form"); // Mô hình dữ liệu của form

    // Lấy dữ liệu từ mô hình form
    const value = formModel.getData();

    // Kiểm tra tính hợp lệ của các trường nhập liệu
    const controls = this.getControlsByFieldGroupId<InputBase>({
      control: dialog,
      groupId: "FormField",
    });

    const isValid = this.validateControls(controls);

    if (!isValid) {
      return;
    }

    // Upload file
    if (this.fileUploader) {
      const fileUploader = this.fileUploader;

      // Lắng nghe sự kiện uploadComplete trước khi thực hiện upload
      fileUploader.attachUploadComplete((oEvent: any) => {
        const parameters = oEvent.getParameters();
        const status = parameters.status;
        const response = parameters.responseRaw;

        if (status === 200) {
          // Giả sử URL của tệp tin được trả về trong response
          const fileUrl = response;

          // Cập nhật dữ liệu form với URL của tệp tin
          value.File = fileUrl;

          // Tạo dữ liệu OData
          oDataModel.create("/EmployeeSet", value, {
            success: (response: any) => {
              MessageToast.show("Employee was successfully added");
              this.onFetchData();
            },
            error: (error: Error) => {
              MessageToast.show("Error adding employee");
              console.error(error);
            },
          });
        } else {
          MessageToast.show("Error uploading file: " + response);
          console.error("Upload error:", response);
        }
      });

      // Thực hiện upload file
      fileUploader.upload();
    }

    this.onCloseAddProduct();
  }

  public onCloseAddProduct() {
    this.addProductDialog?.close();
  }

  public onFileChange(event: any) {
    // Xử lý sự kiện khi người dùng chọn file
    const fileUploader = <FileUploader>event.getSource();
    const file = fileUploader.getValue();

    // Kiểm tra xem người dùng đã chọn file chưa
    if (file) {
      console.log("Selected file:", file);
    }
  }

  // edit product
  public async onOpenEditProduct(event: RowActionItem$PressEvent) {
    const source = event.getSource();
    const rowIndex = event.getParameter("row")?.getIndex();
    const row = <Product>source.getBindingContext("table")?.getObject();

    this.getModel("form").setData(row);

    if (!this.editProductDialog) {
      this.editProductDialog = await (<Promise<Dialog>>this.loadFragment({
        name: "projecttest.view.fragments.EditProduct",
      }));
    }

    this.editProductDialog.bindElement("form>/");
    this.editProductDialog.bindElement(`table>/rows/${rowIndex}`);
    this.editProductDialog.open();
  }
  public onBeforeEditProduct(event: Dialog$BeforeOpenEvent) {
    const oDataModel = <ODataModel>this.component.getModel();
    const formModel = this.getModel("form");
    const dialog = event.getSource();
    const row = <Employee>dialog.getBindingContext("table")?.getObject();

    dialog.setBusy(true);
    const key = oDataModel.createKey("/EmployeeSet", row);
    oDataModel.read(key, {
      success: (response: Employee) => {
        formModel.setData(response);
        dialog.bindElement("form>/");
        dialog.setBusy(false);
      },
      error: (error: Error) => {
        dialog.setBusy(false);
        console.log(error);
      },
    });
  }

  public onCloseEditProduct() {
    this.editProductDialog?.close();
  }

  public onEditProduct(event: Button$PressEvent) {
    const oDataModel = <ODataModel>this.component.getModel();
    const dialog = <Dialog>this.editProductDialog;

    const controls = this.getControlsByFieldGroupId<InputBase>({
      control: this.editProductDialog,
      groupId: "FormField",
    });

    const isValid = this.validateControls(controls);

    if (!isValid) {
      return;
    }

    const value = <Employee>this.getModel("form").getData();

    dialog.setBusy(true);
    const key = oDataModel.createKey("/EmployeeSet", value);
    oDataModel.update(key, value, {
      success: (response: Employee) => {
        MessageToast.show("Product was successfully updated");
        this.onFetchData();
      },
      error: (error: Error) => {
        dialog.setBusy(false);
      },
    });

    this.onCloseEditProduct();
  }

  // chi tiết
  public async onOpenProductDetail(event: ObjectIdentifier$TitlePressEvent) {
    const source = event.getSource();
    const path = <string>source.getBindingContext("table")?.getPath();

    if (!this.productDetailDialog) {
      this.productDetailDialog = await (<Promise<Dialog>>this.loadFragment({
        name: "projecttest.view.fragments.DetailProduct",
      }));
    }

    this.productDetailDialog.bindElement(`table>${path}`);
    this.productDetailDialog.open();
  }

  public onBeforeOpenEmployeeDetail(event: Dialog$BeforeOpenEvent) {
    const oDataModel = <ODataModel>this.component.getModel();
    const formModel = this.getModel("form");
    const dialog = event.getSource();
    const row = <Employee>dialog.getBindingContext("table")?.getObject();

    dialog.setBusy(true);
    const key = oDataModel.createKey("/EmployeeSet", row);

    oDataModel.read(key, {
      success: (response: Employee) => {
        formModel.setData(response);
        dialog.bindElement("form>/");
        dialog.setBusy(false);
      },
      error: (error: Error) => {
        dialog.setBusy(false);
        console.log(error);
      },
    });
  }

  public onCloseProductDetail() {
    this.productDetailDialog?.close();
  }

  // xóa dữ liệu dialog
  public onAfterCloseDialog(event: Dialog$AfterCloseEvent) {
    const dialog = event.getSource();

    const controls = this.getControlsByFieldGroupId<InputBase>({
      control: dialog,
      groupId: "FormField",
    });

    this.clearControlErrorMessages(controls);

    dialog.unbindElement("form");
    dialog.unbindElement("table");
    this.getModel("form").setData({});
  }

  // xóa row
  public onDeleteProduct(event: RowActionItem$PressEvent) {
    const oDataModel = <ODataModel>this.component.getModel();
    const row = <Employee>(
      event.getSource().getBindingContext("table")?.getObject()
    );

    MessageBox.confirm("Do you want to delete this row?", {
      actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
      emphasizedAction: MessageBox.Action.DELETE,
      onClose: (action: unknown) => {
        if (action === MessageBox.Action.DELETE) {
          const key = oDataModel.createKey("/EmployeeSet", row);
          // `/EmployeeSet(Employeeid='${row.Employeeid}')`
          oDataModel.remove(key, {
            success: () => {
              this.onFetchData();
              MessageToast.show("Employee was successfully deleted");
            },
            error: (error: Error) => {
              console.log(error);
            },
          });
        }
      },
    });
  }
  // xóa rows
  public onDeleteProducts() {
    const tableModel = <ODataModel>this.component.getModel();
    const selectedIndices = this.table.getSelectedIndices();

    if (!selectedIndices.length) {
      MessageToast.show("Vui lòng chọn hàng để xóa");
      return;
    }

    MessageBox.confirm("Bạn có muốn xóa các hàng đã chọn?", {
      actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
      emphasizedAction: MessageBox.Action.DELETE,
      onClose: (action: unknown) => {
        if (action === MessageBox.Action.DELETE) {
          const oDataModel = this.getView()?.getModel() as ODataModel;
          const rows = <Employee[]>tableModel.getProperty("/rows");

          // Lấy khóa của các hàng đã chọn
          const selectedKeys = selectedIndices.map((index) => {
            return rows[index].Employeeid; // Thay thế bằng khóa chính của bạn
          });

          // Xóa từng hàng
          const deletePromises = selectedKeys.map((key) => {
            const itemKey = oDataModel.createKey("/EmployeeSet", {
              Employeeid: key,
            });
            return new Promise<void>((resolve, reject) => {
              oDataModel.remove(itemKey, {
                success: () => resolve(),
                error: (error: Error) => reject(error),
              });
            });
          });

          Promise.all(deletePromises)
            .then(() => {
              // Cập nhật dữ liệu mô hình sau khi xóa thành công
              return this.onFetchData(); // Cập nhật dữ liệu từ server
            })
            .then(() => {
              // Bỏ chọn tất cả các hàng
              this.table.clearSelection();

              // Cập nhật mô hình dữ liệu để loại bỏ các hàng đã xóa
              const remainingRows = rows.filter(
                (_, index) => !selectedIndices.includes(index)
              );
              tableModel.setProperty("/rows", remainingRows);

              MessageToast.show("Đã xóa thành công");
            })
            .catch((error: Error) => {
              MessageToast.show("Lỗi khi xóa sản phẩm");
              console.error(error);
            });
        }
      },
    });
  }

  // Table
  public onRowSelectionChange() {
    const indices = this.table.getSelectedIndices();
    this.getModel("table").setProperty("/selectedIndices", [...indices]);
  }

  // Messaging
  public onChangeValue(event: InputBase$ChangeEvent) {
    const source = event.getSource();
    if (source.getVisible()) {
      this.validateInputs(source);
    }
  }

  private clearControlErrorMessages(controls: InputBase[]) {
    controls.forEach((control) => {
      control.setValueState(ValueState.None);
      control.setValueStateText("");
    });
  }

  private getControlsByFieldGroupId<T extends Control>(props: {
    control?: Control;
    groupId: string;
  }) {
    const { control, groupId } = props;

    if (!control) return [];

    const controls = control
      .getControlsByFieldGroupId(groupId)
      .filter((control) => {
        const isVisible = control.getVisible();
        const isValidInput = control.isA(["sap.m.Input", "sap.m.DatePicker"]);

        return isVisible && isValidInput;
      });

    return controls as T[];
  }

  private validateControls(controls: InputBase[]) {
    let isValid = false;
    let isError = false;

    controls.forEach((control) => {
      isError = this.validateInputs(control);
      isValid = isValid || isError;
    });

    return !isValid;
  }

  private validateInputs(source: InputBase) {
    let isError = false;
    let isRequiredError = false;

    if (!source.getBindingContext("form")) {
      return false;
    }

    source.setValueState(ValueState.None);
    source.setValueStateText("");

    const isRequired = source.getRequired();

    if (source.isA<MultiComboBox>("sap.m.MultiComboBox")) {
      const value = source.getSelectedKeys();
      if (!value.length && isRequired) {
        isRequiredError = true;
      }
    } else if (source.isA<DatePicker>("sap.m.DatePicker")) {
      const value = source.getValue();
      if (!value && isRequired) {
        isRequiredError = true;
      }
    } else if (source.isA<Input>("sap.m.Input")) {
      const value = source.getValue();
      if (!value && isRequired) {
        isRequiredError = true;
      }
    }

    if (isRequiredError) {
      source.setValueState(ValueState.Error);
      source.setValueStateText("Required");
      isError = true;
    }

    return isError;
  }

  public formatDate(date: Date): string {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }
}

import ComboBox from "sap/m/ComboBox";
import DatePicker, { DatePicker$ChangeEvent } from "sap/m/DatePicker";
import Input, { Input$LiveChangeEvent } from "sap/m/Input";
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
import { Dict, Product, ProductData } from "../types/utils";
import Base from "./Base.controller";
import DateFormat from "sap/ui/core/format/DateFormat";
import Log from "sap/base/Log";
import { Button$ClickEvent } from "sap/ui/webc/main/Button";
import Dialog from "sap/m/Dialog";
import Button from "sap/m/Button";
import MessageBox from "sap/m/MessageBox";
import VBox from "sap/m/VBox";
import View from "sap/ui/core/mvc/View";
import Form from "sap/ui/commons/form/Form";
import FormContainer from "sap/ui/commons/form/FormContainer";
import FormElement from "sap/ui/commons/form/FormElement";
import ResponsiveGridLayout from "sap/ui/layout/form/ResponsiveGridLayout";

export default class Main extends Base {
  private svm: SmartVariantManagement;
  private expandedLable: Label;
  private snappedLabel: Label;
  private filterBar: FilterBar;
  private table: Table;
  private view: View;
  private detailDialog: Dialog | null;
  private addRowDialog: Dialog | null;

  public onInit(): void {
    const jSonModel = this.initSampleDataModel();
    this.getView()?.setModel(jSonModel);

    this.view = <View>this.getView();
    this.view.setModel(jSonModel);

    this.svm = this.getControlById("svm");
    this.expandedLable = this.getControlById("expandedLable");
    this.snappedLabel = this.getControlById("snappedLabel");
    this.filterBar = this.getControlById("filterbar");
    this.table = this.getControlById("table");

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

    // console.log(values);
  }

  public initSampleDataModel(): JSONModel {
    const model = new JSONModel();

    fetch(sap.ui.require.toUrl("projecttest/mockdata/product.json"))
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok.");
        }
        return response.json();
      })
      .then((data: ProductData) => {
        model.setData(data);
      })
      .catch((error: Error) => {
        Log.error("Failed to load JSON: " + error.message);
      });

    // Trả về dữ liệu
    return model;
  }
  // tạo dialog mới
  // private createDetailDialog(): void {
  //   if (this.detailDialog) {
  //     this.detailDialog.destroy(); // Xóa dialog cũ nếu đã tồn tại
  //   }

  //   this.detailDialog = new Dialog({
  //     title: "Chi Tiết",
  //     content: new VBox({
  //       items: [
  //         new Label({ text: "Mã PR" }),
  //         new Input({ id: "inputMaPr", enabled: true }),

  //         new Label({ text: "Delete ID" }),
  //         new Input({ id: "inputDeleteId", enabled: true }),

  //         new Label({ text: "Số lượng" }),
  //         new Input({ id: "inputQuantity", enabled: true }),

  //         new Label({ text: "Nhà máy" }),
  //         new Input({ id: "inputFactory", enabled: true }),

  //         new Label({ text: "Mã PO" }),
  //         new Input({ id: "inputPO", enabled: true }),

  //         new Label({ text: "Ngày cập nhật" }),
  //         new DatePicker({ id: "inputDateUpdate", enabled: true }),
  //       ],
  //     }),
  //     beginButton: new Button({
  //       text: "Close",
  //       press: () => {
  //         if (this.detailDialog) {
  //           this.detailDialog.close();
  //         }
  //       },
  //     }),
  //     afterClose: () => {
  //       if (this.detailDialog) {
  //         this.detailDialog.destroy();
  //         this.detailDialog = null; // Đặt lại thành null để tránh lỗi trong lần sử dụng sau
  //       }
  //     },
  //     contentWidth: "400px",
  //     contentHeight: "auto",
  //     draggable: true,
  //     resizable: true,
  //   });
  // }

  private createAddRowDialog(): void {
    if (this.addRowDialog) {
      this.addRowDialog.destroy(); // Xóa dialog cũ nếu đã tồn tại
      this.addRowDialog = null;
    }

    this.addRowDialog = new Dialog({
      title: "Add Row",
      content: new Form({
        layout: new ResponsiveGridLayout(),
        formContainers: [
          new FormContainer({
            formElements: [
              new FormElement({
                label: new Label({ text: "Mã PR" }),
                fields: [
                  new Input({
                    id: "inputMaPr",
                    placeholder: "Enter MaPr",
                    valueState: "None",
                    change: this.onChangeValue.bind(this),
                  }),
                ],
              }),
              new FormElement({
                label: new Label({ text: "Delete ID" }),
                fields: [
                  new Input({
                    id: "inputDeleteId",
                    placeholder: "Enter DeleteId",
                    valueState: "None",
                    change: this.onChangeValue.bind(this),
                  }),
                ],
              }),
              new FormElement({
                label: new Label({ text: "Số lượng" }),
                fields: [
                  new Input({
                    id: "inputQuantity",
                    placeholder: "Enter Quantity",
                    valueState: "None",
                    change: this.onChangeValue.bind(this),
                  }),
                ],
              }),
              new FormElement({
                label: new Label({ text: "Nhà máy" }),
                fields: [
                  new Input({
                    id: "inputFactory",
                    placeholder: "Enter Factory",
                    valueState: "None",
                    change: this.onChangeValue.bind(this),
                  }),
                ],
              }),
              new FormElement({
                label: new Label({ text: "Mã PO" }),
                fields: [
                  new Input({
                    id: "inputPO",
                    placeholder: "Enter PO",
                    valueState: "None",
                    change: this.onChangeValue.bind(this),
                  }),
                ],
              }),
              new FormElement({
                label: new Label({ text: "Ngày cập nhật" }),
                fields: [
                  new DatePicker({
                    id: "inputUpdateDate",
                    placeholder: "Enter Update Date",
                    valueState: "None",
                    change: this.onChangeValue.bind(this),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      beginButton: new Button({
        text: "Save",
        press: () => {
          // Xóa trạng thái lỗi trước khi kiểm tra
          const inputs = this.getDialogFields(this.addRowDialog!);
          Object.values(inputs).forEach((input) => {
            if (input instanceof Input || input instanceof DatePicker) {
              input.setValueState("None");
              input.setValueStateText("");
            }
          });

          if (this.validateFields(inputs)) {
            // Tạo model mới và gán giá trị từ các trường nhập liệu
            const newModelData = {
              MaPr: this.getFieldValue(inputs.inputMaPr),
              DeleteId: this.getFieldValue(inputs.inputDeleteId),
              SoLuong:
                parseFloat(this.getFieldValue(inputs.inputQuantity)) || 0,
              NhaMay: this.getFieldValue(inputs.inputFactory),
              MaPO: this.getFieldValue(inputs.inputPO),
              DateUpdate: this.getFieldValue(inputs.inputUpdateDate),
            };

            // Cập nhật model chính
            const model = this.getView()?.getModel() as JSONModel;
            if (model) {
              const data =
                (model.getProperty("/ProductCollection") as Product[]) || [];
              data.unshift(newModelData);
              model.setProperty("/ProductCollection", data);

              MessageBox.success("Thêm hàng thành công.");
              this.addRowDialog?.close();
            } else {
              MessageBox.error("No data model available.");
            }
          } else {
            MessageBox.error("Please fill all the required fields.");
          }
        },
      }),
      endButton: new Button({
        text: "Cancel",
        press: () => this.addRowDialog?.close(),
      }),
      afterClose: () => {
        if (this.addRowDialog) {
          this.addRowDialog.destroy();
          this.addRowDialog = null; // Đặt lại thành null để tránh lỗi trong lần sử dụng sau
        }
      },
      contentWidth: "400px",
      contentHeight: "auto",
      draggable: true,
      resizable: true,
    });
  }

  public onAddRow(): void {
    // Tạo dialog nếu chưa được tạo
    if (!this.addRowDialog) {
      this.createAddRowDialog();
    }

    this.addRowDialog?.open();
  }

  private onChangeValue(event: Input$LiveChangeEvent): void {
    const input = event.getSource() as Input | DatePicker;
    if (input) {
      input.setValueState("None"); // Đặt trạng thái giá trị là "None" khi có thay đổi
      input.setValueStateText(""); // Xóa thông báo lỗi
    }
  }

  private getFieldValue(field: Input | DatePicker): string {
    if (field instanceof Input) {
      return field.getValue() || ""; // Trả về giá trị mặc định là chuỗi rỗng nếu không có giá trị
    } else if (field instanceof DatePicker) {
      const dateValue = field.getDateValue();
      const dateFormat = DateFormat.getDateInstance({ pattern: "dd/MM/yyyy" });
      return dateValue ? dateFormat.format(dateValue) : ""; // Trả về chuỗi rỗng nếu không có giá trị
    }
    return ""; // Trả về chuỗi rỗng nếu không phải Input hoặc DatePicker
  }

  private getDialogFields(dialog: Dialog): {
    [key: string]: Input | DatePicker;
  } {
    const dialogContent = dialog.getContent()[0] as Form;
    const fields: { [key: string]: Input | DatePicker } = {};

    dialogContent.getFormContainers().forEach((container) => {
      container.getFormElements().forEach((element) => {
        element.getFields().forEach((field) => {
          if (field instanceof Input || field instanceof DatePicker) {
            fields[field.getId()] = field;
          }
        });
      });
    });

    return fields;
  }

  private validateFields(inputs: {
    [key: string]: Input | DatePicker;
  }): boolean {
    let isValid = true;

    Object.keys(inputs).forEach((key) => {
      const input = inputs[key];
      if (input instanceof Input) {
        const value = input.getValue();
        if (!value) {
          input.setValueState("Error");
          input.setValueStateText("This field cannot be empty.");
          isValid = false;
        } else {
          input.setValueState("None");
        }
      } else if (input instanceof DatePicker) {
        const dateValue = input.getDateValue();
        if (!dateValue) {
          input.setValueState("Error");
          input.setValueStateText("This field cannot be empty.");
          isValid = false;
        } else {
          input.setValueState("None");
        }
      }
    });

    return isValid;
  }

  // hàm chi tiết
  public handleDetails(event: Button$ClickEvent): void {
    const bindingContext = event.getSource().getBindingContext();

    if (bindingContext) {
      // Lấy đối tượng sản phẩm và gán kiểu Product
      const product: Product = bindingContext.getObject() as Product;
      const dateFormat = DateFormat.getDateInstance({ pattern: "d/M/yyyy" });

      // Tạo dialog nếu chưa được tạo
      if (!this.detailDialog) {
        this.createDetailDialog();
      }

      // Cập nhật giá trị cho các trường trong dialog
      const dialogContent = this.detailDialog?.getContent()[0] as VBox;
      const inputs =
        dialogContent?.getItems().reduce((acc, item) => {
          if (item instanceof Input || item instanceof DatePicker) {
            acc[item.getId()] = item;
          }
          return acc;
        }, {} as { [key: string]: Input | DatePicker }) || {};

      // Ép kiểu không an toàn, đảm bảo các trường chắc chắn tồn tại
      (inputs.inputMaPr as Input).setValue(product.MaPr);
      (inputs.inputDeleteId as Input).setValue(product.DeleteId);
      (inputs.inputQuantity as Input).setValue(product.SoLuong.toString());
      (inputs.inputFactory as Input).setValue(product.NhaMay);
      (inputs.inputPO as Input).setValue(product.MaPO);
      (inputs.inputDateUpdate as DatePicker).setValue(
        dateFormat.format(new Date(product.DateUpdate))
      );

      this.detailDialog?.open();
    } else {
      MessageBox.error("No item selected.");
    }
  }

  // hàm xóa 1 row

  public onDeleteRow(event: Button$ClickEvent): void {
    const bindingContext = event.getSource()?.getBindingContext();

    if (bindingContext) {
      const model = this.getView()?.getModel() as JSONModel;

      if (model) {
        const selectedId = bindingContext.getProperty("MaPr");

        MessageBox.confirm("Bạn có chắc chắn muốn xóa không?", {
          actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
          emphasizedAction: MessageBox.Action.OK,
          onClose: (action: unknown) => {
            if (action === MessageBox.Action.OK) {
              const data = model.getProperty("/ProductCollection") as Product[];
              const updatedData = data.filter(
                (item: Product) => item.MaPr !== selectedId
              );

              model.setProperty("/ProductCollection", updatedData);
              MessageBox.success("Xóa thành công");
            }
          },
        });
      } else {
        MessageBox.error("No data model available.");
      }
    } else {
      MessageBox.error("No item selected.");
    }
  }

  // hàm xóa nhiều row
  public onDeleteRows(): void {
    const table = this.byId("table") as Table;
    const model = this.getView()?.getModel() as JSONModel;
    const selectedIndices = table.getSelectedIndices();

    if (selectedIndices.length === 0) {
      MessageBox.error("Bạn chưa chọn hàng nào");
      return;
    }

    MessageBox.confirm("Bạn có chắc chắn muốn xóa không?", {
      actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
      emphasizedAction: MessageBox.Action.OK,
      onClose: (action: unknown) => {
        if (action === MessageBox.Action.OK) {
          const data = model.getProperty("/ProductCollection") as Product[];

          // Sử dụng filter để tạo mảng mới mà không chứa các mục đã chọn để xóa
          const filteredData = data.filter(
            (_, index) => !selectedIndices.includes(index)
          );

          model.setProperty("/ProductCollection", filteredData);
          table.clearSelection(); // Deselect all rows
          MessageBox.success("Xóa thành công.");
        }
      },
    });
  }

  // hàm thêm row
  // public onAddRow(): void {
  //   // Hàm kiểm tra tính hợp lệ của các trường nhập liệu
  //   const validateFields = (inputs: {
  //     [key: string]: Input | DatePicker;
  //   }): boolean => {
  //     let isValid = true;

  //     Object.keys(inputs).forEach((key) => {
  //       const input = inputs[key];
  //       if (input instanceof Input) {
  //         const value = input.getValue();
  //         if (!value) {
  //           input.setValueState("Error");
  //           input.setValueStateText("This field cannot be empty.");
  //           isValid = false;
  //         } else {
  //           input.setValueState("None");
  //         }
  //       } else if (input instanceof DatePicker) {
  //         const dateValue = input.getDateValue();
  //         if (!dateValue) {
  //           input.setValueState("Error");
  //           input.setValueStateText("This field cannot be empty.");
  //           isValid = false;
  //         } else {
  //           input.setValueState("None");
  //         }
  //       }
  //     });

  //     return isValid;
  //   };

  //   // Hàm tạo trường nhập liệu (Input hoặc DatePicker)
  //   const createField = (
  //     id: string,
  //     placeholder: string,
  //     type: "Input" | "DatePicker"
  //   ): Input | DatePicker => {
  //     if (type === "Input") {
  //       return new Input({
  //         id: id,
  //         placeholder: placeholder,
  //         tooltip: "This field cannot be empty.",
  //         valueState: "None",
  //         liveChange: (event: Input$LiveChangeEvent) => {
  //           const input = event.getSource();
  //           const value = input.getValue();
  //           if (!value) {
  //             input.setValueState("Error");
  //             input.setValueStateText("This field cannot be empty.");
  //           } else {
  //             input.setValueState("None");
  //           }
  //         },
  //       });
  //     } else {
  //       return new DatePicker({
  //         id: id,
  //         placeholder: placeholder,
  //         tooltip: "This field cannot be empty.",
  //         valueState: "None",
  //         change: (event: DatePicker$ChangeEvent) => {
  //           const datePicker = event.getSource();
  //           const dateValue = datePicker.getDateValue();
  //           if (!dateValue) {
  //             datePicker.setValueState("Error");
  //             datePicker.setValueStateText("This field cannot be empty.");
  //           } else {
  //             datePicker.setValueState("None");
  //           }
  //         },
  //       });
  //     }
  //   };

  //   // Tạo các trường nhập liệu
  //   const inputs: { [key: string]: Input | DatePicker } = {
  //     inputMaPr: createField("inputMaPr", "Enter MaPr", "Input"),
  //     inputDeleteId: createField("inputDeleteId", "Enter DeleteId", "Input"),
  //     inputQuantity: createField("inputQuantity", "Enter Quantity", "Input"),
  //     inputFactory: createField("inputFactory", "Enter Factory", "Input"),
  //     inputPO: createField("inputPO", "Enter PO", "Input"),
  //     inputUpdateDate: createField(
  //       "inputUpdateDate",
  //       "Enter Update Date",
  //       "DatePicker"
  //     ),
  //   };

  //   // Tạo dialog với các trường nhập liệu
  //   const dialog = new Dialog({
  //     title: "Add Row",
  //     content: new Form({
  //       layout: new ResponsiveGridLayout(),
  //       formContainers: [
  //         new FormContainer({
  //           formElements: Object.keys(inputs).map(
  //             (key) =>
  //               new FormElement({
  //                 label: new Label({ text: key }),
  //                 fields: [inputs[key]],
  //               })
  //           ),
  //         }),
  //       ],
  //     }),
  //     beginButton: new Button({
  //       text: "Save",
  //       press: () => {
  //         // Xóa trạng thái lỗi trước khi kiểm tra
  //         Object.values(inputs).forEach((input) => {
  //           if (input instanceof Input || input instanceof DatePicker) {
  //             input.setValueState("None");
  //             input.setValueStateText("");
  //           }
  //         });

  //         if (validateFields(inputs)) {
  //           // Tạo model mới và gán giá trị từ các trường nhập liệu
  //           const newModelData = {
  //             MaPr: this.getFieldValue(inputs.inputMaPr),
  //             DeleteId: this.getFieldValue(inputs.inputDeleteId),
  //             SoLuong:
  //               parseFloat(this.getFieldValue(inputs.inputQuantity)) || 0,
  //             NhaMay: this.getFieldValue(inputs.inputFactory),
  //             MaPO: this.getFieldValue(inputs.inputPO),
  //             DateUpdate: this.getFieldValue(inputs.inputUpdateDate),
  //           };

  //           // Cập nhật model chính
  //           const model = this.getView()?.getModel() as JSONModel;
  //           if (model) {
  //             const data =
  //               (model.getProperty("/ProductCollection") as Product[]) || [];
  //             data.unshift(newModelData);
  //             model.setProperty("/ProductCollection", data);

  //             // Hiển thị thông báo thành công
  //             MessageBox.success("Thêm hàng thành công.");

  //             dialog.close();
  //           } else {
  //             MessageBox.error("No data model available.");
  //           }
  //         } else {
  //           MessageBox.error("Please fill all the required fields.");
  //         }
  //       },
  //     }),
  //     endButton: new Button({
  //       text: "Cancel",
  //       press: () => dialog.close(),
  //     }),
  //     afterClose: () => dialog.destroy(), // Xóa dialog sau khi đóng
  //     contentWidth: "400px",
  //     contentHeight: "auto",
  //     draggable: true,
  //     resizable: true,
  //   });

  //   dialog.open();
  // }

  // lấy ra số thứ tự của các ô mình đã chọn

  // public getSelectedIndices() {
  //   const indices = this.byId("table").getSelectedIndices();
  //   let msg;
  //   if (indices.length < 1) {
  //     msg = "no item selected";
  //   } else {
  //     msg = indices;
  //   }
  //   MessageToast.show(msg);
  // }
  // Lấy ra chiều dài của mảng
  // public getContextByIndex() {
  //   const table = this.byId("table");
  //   const index = table.getSelectedIndex();
  //   let msg;
  //   if (index < 0) {
  //     msg = "no item selected";
  //   } else {
  //     msg = table.getContextByIndex(index);
  //   }
  //   MessageToast.show(msg);
  // }

  // xóa những ô mình chọn
  // public clearSelection() {
  //   this.byId("table").clearSelection();
  // }

  // bật tắt chọn tất cả
  // public onSwitchChange(event: Switch$ChangeEvent) {
  //   const table = this.byId("table");
  //   table.setEnableSelectAll(event.getParameter("state"));
  // }

  private createDetailDialog(): void {
    if (this.detailDialog) {
      this.detailDialog.destroy();
      this.detailDialog = null;
    }

    this.detailDialog = new Dialog({
      title: "Chi Tiết",
      content: new VBox({
        items: [
          new Label({ text: "Mã PR" }),
          new Input({ id: "inputMaPr", enabled: true }),

          new Label({ text: "Delete ID" }),
          new Input({ id: "inputDeleteId", enabled: true }),

          new Label({ text: "Số lượng" }),
          new Input({ id: "inputQuantity", enabled: true }),

          new Label({ text: "Nhà máy" }),
          new Input({ id: "inputFactory", enabled: true }),

          new Label({ text: "Mã PO" }),
          new Input({ id: "inputPO", enabled: true }),

          new Label({ text: "Ngày cập nhật" }),
          new DatePicker({ id: "inputDateUpdate", enabled: true }),
        ],
      }),
      beginButton: new Button({
        text: "Close",
        press: () => {
          this.detailDialog?.close();
        },
      }),
      afterClose: () => {
        this.detailDialog?.destroy();
        this.detailDialog = null;
      },
      contentWidth: "400px",
      contentHeight: "auto",
      draggable: true,
      resizable: true,
    });
  }

  // public handleDetails(event: Button$ClickEvent): void {
  //   const bindingContext = event.getSource().getBindingContext();

  //   if (bindingContext) {
  //     const product: Product = bindingContext.getObject() as Product;

  //     // Chuyển đổi giá trị ngày từ chuỗi thành đối tượng Date, hoặc null nếu không có giá trị
  //     const dateUpdateValue: Date | null = product.DateUpdate
  //       ? new Date(product.DateUpdate)
  //       : null;

  //     if (!this.detailDialog) {
  //       this.createDetailDialog();
  //     }

  //     if (this.detailDialog) {
  //       const inputs = this.getDialogFields(this.detailDialog);

  //       (inputs["inputMaPr"] as Input)?.setValue(product.MaPr || "");
  //       (inputs["inputDeleteId"] as Input)?.setValue(product.DeleteId || "");
  //       (inputs["inputQuantity"] as Input)?.setValue(
  //         product.SoLuong ? product.SoLuong.toString() : ""
  //       );
  //       (inputs["inputFactory"] as Input)?.setValue(product.NhaMay || "");
  //       (inputs["inputPO"] as Input)?.setValue(product.MaPO || "");

  //       // Chỉ đặt giá trị ngày nếu dateUpdateValue không phải là null
  //       (inputs["inputDateUpdate"] as DatePicker)?.setDateValue(
  //         dateUpdateValue ?? undefined
  //       );

  //       this.detailDialog.open();
  //     }
  //   } else {
  //     MessageBox.error("No item selected.");
  //   }
  // }
}

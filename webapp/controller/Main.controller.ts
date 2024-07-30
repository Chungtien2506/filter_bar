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
import { Dict, Product } from "../types/utils";
import Base from "./Base.controller";
import DateFormat from "sap/ui/core/format/DateFormat";
import UI5Date from "sap/ui/core/date/UI5Date";
import Log from "sap/base/Log";
import { Button$ClickEvent } from "sap/ui/webc/main/Button";
import Dialog from "sap/m/Dialog";
import Button from "sap/m/Button";
import MessageBox from "sap/m/MessageBox";
import VBox from "sap/m/VBox";

export default class Main extends Base {
  private svm: SmartVariantManagement;
  private expandedLable: Label;
  private snappedLabel: Label;
  private filterBar: FilterBar;
  private table: Table;

  public onInit(): void {
    const jSonModel = this.initSampleDataModel();
    this.getView()?.setModel(jSonModel);

    const view: any = this.getView();
    view.setModel(jSonModel);

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

  public initSampleDataModel() {
    const model = new JSONModel();
    const dateFormat = DateFormat.getDateInstance({
      pattern: "dd/MM/yyyy",
    });

    // Sử dụng fetch để lấy dữ liệu JSON
    fetch(sap.ui.require.toUrl("projecttest/mockdata/product.json"))
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok.");
        }
        return response.json();
      })
      .then((data) => {
        const temp1 = [];
        const temp2 = [];
        const suppliersData = [];
        const categoryData = [];

        for (let i = 0; i < data.ProductCollection.length; i++) {
          const product = data.ProductCollection[i];

          // Tên nhà cung cấp
          if (product.SupplierName && temp1.indexOf(product.SupplierName) < 0) {
            temp1.push(product.SupplierName);
            suppliersData.push({ Name: product.SupplierName });
          }

          // Danh mục
          if (product.Category && temp2.indexOf(product.Category) < 0) {
            temp2.push(product.Category);
            categoryData.push({ Name: product.Category });
          }

          product.DeliveryDate =
            Date.now() - (i % 10) * 4 * 24 * 60 * 60 * 1000;
          product.DeliveryDateStr = dateFormat.format(
            UI5Date.getInstance(product.DeliveryDate)
          );
          product.Heavy = product.WeightMeasure > 1000 ? "true" : "false";
          product.Available = product.Status === "Available" ? true : false;
        }

        // Cập nhật dữ liệu
        data.Suppliers = suppliersData;
        data.Categories = categoryData;
        model.setData(data);
      })
      .catch((error) => {
        Log.error("Failed to load JSON: " + error.message);
      });

    // Trả về dữ liệu
    return model;
  }
  // hàm chi tiết
  public handleDetails(event: Button$ClickEvent): void {
    const bindingContext = event.getSource().getBindingContext();

    if (bindingContext) {
      // Lấy đối tượng sản phẩm và gán kiểu Product
      const product: Product = bindingContext.getObject() as Product;

      // Tạo form dialog
      const dialog = new Dialog({
        title: "Chi Tiết ",
        content: new VBox({
          items: [
            new Label({ text: "Mã PR" }),
            new Input({ value: product.MaPr, enabled: true }),

            new Label({ text: "Delete ID" }),
            new Input({ value: product.DeleteId, enabled: true }),

            new Label({ text: "Số lượng" }),
            new Input({ value: product.SoLuong.toString(), enabled: true }),

            new Label({ text: "Nhà máy" }),
            new Input({ value: product.NhaMay, enabled: true }),

            new Label({ text: "Mã PO" }),
            new Input({ value: product.MaPO, enabled: true }),

            new Label({ text: "Ngày cập nhật" }),
            new DatePicker({ value: product.DateUpdate, enabled: true }),
          ],
        }),
        beginButton: new Button({
          text: "Close",
          press: () => {
            dialog.close();
          },
        }),
        afterClose: () => {
          dialog.destroy();
        },
        contentWidth: "400px", // Thiết lập chiều rộng của dialog
        contentHeight: "auto", // Chiều cao tự động dựa trên nội dung
        draggable: true, // Cho phép kéo dialog
        resizable: true, // Cho phép thay đổi kích thước dialog
      });

      dialog.open();
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
          const indicesToDelete = new Set(selectedIndices);

          // Sử dụng reduce để tạo mảng mới mà không chứa các mục đã chọn để xóa
          const filteredData = data.reduce<Product[]>((acc, item, index) => {
            if (!indicesToDelete.has(index)) {
              acc.push(item);
            }
            return acc;
          }, []);

          model.setProperty("/ProductCollection", filteredData);
          // table.clearSelection();
          MessageBox.success("Xóa thành công.");
        }
      },
    });
  }

  // hàm thêm row
  public onAddRow(): void {
    let inputMaPr: Input;
    let inputDeleteId: Input;
    let inputQuantity: Input;
    let inputFactory: Input;
    let inputPO: Input;
    let inputUpdateDate: DatePicker;

    // Tạo form dialog với các trường nhập liệu
    const dialog = new Dialog({
      title: "Add  Row",
      content: new VBox({
        items: [
          new Label({ text: "Mã PR" }),
          (inputMaPr = new Input({
            id: "inputMaPr",
            placeholder: "Enter MaPr",
          })),
          new Label({ text: "Delete ID" }),
          (inputDeleteId = new Input({
            id: "inputDeleteId",
            placeholder: "Enter DeleteId",
          })),
          new Label({ text: "Số lượng" }),
          (inputQuantity = new Input({
            id: "inputQuantity",
            placeholder: "Enter Quantity",
            type: "Number",
          })),
          new Label({ text: "Nhà Máy" }),
          (inputFactory = new Input({
            id: "inputFactory",
            placeholder: "Enter Factory",
          })),
          new Label({ text: "Mã PO" }),
          (inputPO = new Input({ id: "inputPO", placeholder: "Enter PO" })),
          new Label({ text: "Ngày cập nhật" }),
          (inputUpdateDate = new DatePicker({
            id: "inputUpdateDate",
            placeholder: "Enter Update Date",
          })),
        ],
      }),
      beginButton: new Button({
        text: "Save",
        press: () => {
          const dateFormat = DateFormat.getDateInstance({
            pattern: "dd/MM/yyyy",
          });
          // Lấy giá trị từ các trường nhập liệu
          const newRow: Product = {
            MaPr: inputMaPr.getValue(),
            DeleteId: inputDeleteId.getValue(),
            SoLuong: parseFloat(inputQuantity.getValue()) || 0,
            NhaMay: inputFactory.getValue(),
            MaPO: inputPO.getValue(),
            DateUpdate: dateFormat.format(
              inputUpdateDate.getDateValue() || new Date()
            ),
          };

          console.log("New Row Data:", newRow);

          // Lấy mô hình dữ liệu và kiểm tra
          const model = this.getView()?.getModel() as JSONModel;
          if (model) {
            // Lấy dữ liệu hiện tại
            const data: Product[] =
              model.getProperty("/ProductCollection") || [];

            // Thêm hàng mới vào mảng dữ liệu
            data.unshift(newRow);

            // Cập nhật mô hình dữ liệu
            model.setProperty("/ProductCollection", data);

            // Đóng dialog
            dialog.close();
          } else {
            MessageBox.error("No data model available.");
          }
        },
      }),
      endButton: new Button({
        text: "Cancel",
        press: () => dialog.close(),
      }),
      afterClose: () => dialog.destroy(), // Xóa dialog sau khi đóng
      contentWidth: "400px", // Thiết lập chiều rộng của dialog
      contentHeight: "auto", // Chiều cao tự động dựa trên nội dung
      draggable: true, // Cho phép kéo dialog
      resizable: true, // Cho phép thay đổi kích thước dialog
    });

    dialog.open();
  }

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
}

import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button } from "antd";
import { EditOutlined, UserOutlined, PhoneOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { message } from "../utils/antdStatic";
import apiCaller from "../utils/apiCaller";
import useCustomerStore, { ICustomer } from "../store/customer.store";

interface EditCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  customer: ICustomer | any | null;
  onSuccess?: (updatedCustomer: any) => void;
}

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  visible,
  onClose,
  customer,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const updateCustomerInStore = useCustomerStore((state) => state.updateCustomer);

  useEffect(() => {
    if (visible && customer) {
      form.setFieldsValue({
        name: customer.name || "",
        phone: customer.phone ? String(customer.phone) : "",
        address: customer.address || "",
      });
    } else {
      form.resetFields();
    }
  }, [visible, customer, form]);

  const handleSubmit = async (values: any) => {
    if (!customer?._id) return;
    setLoading(true);
    try {
      // Strictly sending name, phone, address and nothing else
      const payload = {
        name: values.name.trim(),
        phone: String(values.phone).trim(),
        address: values.address ? values.address.trim() : "",
      };

      const res = await apiCaller.put(`/customers/${customer._id}`, payload);

      if (res.data?.success) {
        const updated = res.data.data.customer;
        message.success("Customer details updated successfully");
        updateCustomerInStore(updated);
        if (onSuccess) {
          onSuccess(updated);
        }
        onClose();
      } else {
        message.error(res.data?.message || "Failed to update customer");
      }
    } catch (err: any) {
      message.error(
        err?.response?.data?.message ||
        err?.response?.data?.msg ||
        "Failed to update customer details"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      centered
      width={480}
      className="custom-edit-customer-modal"
    >
      <div className="pt-2">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-lg">
            <EditOutlined />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-800 tracking-tight leading-tight">
              Edit Customer Details
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
              Authorized Admin Access Only
            </p>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
          autoComplete="off"
        >
          <Form.Item
            label={
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <UserOutlined className="text-indigo-400" /> Customer Name
              </span>
            }
            name="name"
            rules={[
              { required: true, message: "Customer name is required" },
              { min: 2, max: 50, message: "Name must be 2-50 characters" },
            ]}
          >
            <Input
              placeholder="e.g. John Doe"
              className="h-12 rounded-xl font-bold border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white text-gray-800"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <PhoneOutlined className="text-indigo-400" /> Mobile Number
              </span>
            }
            name="phone"
            rules={[
              { required: true, message: "Mobile number is required" },
              { pattern: /^[0-9]{10}$/, message: "Must be a valid 10-digit mobile number" },
            ]}
          >
            <Input
              maxLength={10}
              placeholder="10-digit mobile number"
              className="h-12 rounded-xl font-bold border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white text-gray-800"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <EnvironmentOutlined className="text-indigo-400" /> Address (Optional)
              </span>
            }
            name="address"
          >
            <Input.TextArea
              rows={3}
              placeholder="e.g. Shop 4, Market Complex, City"
              className="rounded-xl font-medium border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white text-gray-800 p-3"
            />
          </Form.Item>

          <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 mb-6">
            <p className="text-[10px] font-bold text-amber-800 m-0 leading-normal">
              Note: As an Admin, you can edit customer name, phone number, and address. Customer balance due is calculated automatically from bills and payments and cannot be changed directly here.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <Button
              onClick={onClose}
              disabled={loading}
              className="h-11 px-5 rounded-xl font-black text-xs uppercase tracking-wider text-gray-500 hover:text-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="h-11 px-6 rounded-xl font-black text-xs uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 border-none shadow-md shadow-indigo-200"
            >
              Save Changes
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default EditCustomerModal;


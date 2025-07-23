import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  Card,
  Typography,
  Row,
  Col,
  Spin,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Title } = Typography;

export type ProductFormValues = {
  name: string;
  measuring: string;
  mrp: number | string;
  costPrice: number | string;
  retailPrice: number | string;
  wholesalePrice: number | string;
  superWholesalePrice: number | string;
  barcode: string;
  stock: number | string;
  packet: number | string;
  box: number | string;
  minQuantity: number | string;
  category: string;
};

interface ProductFormProps {
  initialValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  loading?: boolean;
  categories: { value: string; label: string }[];
  mode?: "create" | "edit";
}

const defaultValues: ProductFormValues = {
  name: "",
  measuring: "",
  mrp: "",
  costPrice: "",
  retailPrice: "",
  wholesalePrice: "",
  superWholesalePrice: "",
  barcode: "",
  stock: "",
  packet: "",
  box: "",
  minQuantity: 1,
  category: "",
};

const ProductForm = ({
  initialValues,
  onSubmit,
  loading,
  categories,
  mode = "create",
}: ProductFormProps) => {
  const [form] = Form.useForm<ProductFormValues>();
  const navigate = useNavigate();

  useEffect(() => {
    form.setFieldsValue({ ...defaultValues, ...initialValues });
  }, [initialValues, form]);

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen bg-gray-50 py-8 px-2">
      <div className="w-full max-w-2xl">
        <Button
          type="text"
          icon={<ArrowLeftOutlined style={{ fontSize: 22 }} />}
          onClick={() => navigate("/products")}
          className="mb-2 mt-2"
          style={{ fontSize: 18 }}
        >
          Back
        </Button>
        <Card
          className="shadow-lg border border-gray-100"
          bodyStyle={{ padding: 32 }}
        >
          <Title level={3} className="text-center mb-8">
            {mode === "edit" ? "Edit Product" : "Create a New Product"}
          </Title>
          <Form
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            initialValues={{ ...defaultValues, ...initialValues }}
            autoComplete="off"
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Name"
                  name="name"
                  rules={[
                    { required: true, message: "Please enter product name" },
                  ]}
                >
                  <Input placeholder="Enter the name" autoFocus />
                </Form.Item>
                <Form.Item
                  label="MRP"
                  name="mrp"
                  rules={[{ required: true, message: "Please enter MRP" }]}
                >
                  <InputNumber min={0} className="w-full" placeholder="MRP ₹" />
                </Form.Item>
                <Form.Item
                  label="Retail Price"
                  name="retailPrice"
                  rules={[
                    { required: true, message: "Please enter retail price" },
                  ]}
                >
                  <InputNumber
                    min={0}
                    className="w-full"
                    placeholder="Retail Price"
                  />
                </Form.Item>
                <Form.Item
                  label="Super Wholesale Price"
                  name="superWholesalePrice"
                  rules={[
                    {
                      required: true,
                      message: "Please enter super wholesale price",
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    className="w-full"
                    placeholder="Super Wholesale Price"
                  />
                </Form.Item>
                <Form.Item
                  label="Stock"
                  name="stock"
                  rules={[{ required: true, message: "Please enter stock" }]}
                >
                  <InputNumber min={0} className="w-full" placeholder="Stock" />
                </Form.Item>
                <Form.Item
                  label="Box (pieces in box)"
                  name="box"
                  rules={[{ required: true, message: "Please enter box size" }]}
                >
                  <InputNumber
                    min={0}
                    className="w-full"
                    placeholder="Box size"
                  />
                </Form.Item>
                <Form.Item
                  label="Category"
                  name="category"
                  rules={[
                    { required: true, message: "Please select a category" },
                  ]}
                >
                  <Select
                    showSearch
                    placeholder="Select a category"
                    options={categories}
                    optionFilterProp="label"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Type"
                  name="measuring"
                  rules={[
                    { required: true, message: "Please select measuring unit" },
                  ]}
                >
                  <Select placeholder="Select the Measuring Unit">
                    <Select.Option value="kg">Kilogram</Select.Option>
                    <Select.Option value="piece">Pieces</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  label="Cost Price"
                  name="costPrice"
                  rules={[
                    { required: true, message: "Please enter cost price" },
                  ]}
                >
                  <InputNumber
                    min={0}
                    className="w-full"
                    placeholder="Cost Price"
                  />
                </Form.Item>
                <Form.Item
                  label="Wholesale Price"
                  name="wholesalePrice"
                  rules={[
                    { required: true, message: "Please enter wholesale price" },
                  ]}
                >
                  <InputNumber
                    min={0}
                    className="w-full"
                    placeholder="Wholesale Price"
                  />
                </Form.Item>
                <Form.Item
                  label="Barcode"
                  name="barcode"
                  rules={[{ required: true, message: "Please enter barcode" }]}
                >
                  <Input placeholder="Enter the barcode" />
                </Form.Item>
                <Form.Item
                  label="Packet (pieces in packet)"
                  name="packet"
                  rules={[
                    { required: true, message: "Please enter packet size" },
                  ]}
                >
                  <InputNumber
                    min={0}
                    className="w-full"
                    placeholder="Packet size"
                  />
                </Form.Item>
                <Form.Item
                  label="Minimum Quantity"
                  name="minQuantity"
                  rules={[
                    {
                      required: true,
                      message: "Please enter minimum quantity",
                    },
                  ]}
                >
                  <InputNumber
                    min={1}
                    className="w-full"
                    placeholder="Minimum quantity"
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="w-full mt-2"
                    size="large"
                  >
                    {mode === "edit" ? "Update Product" : "Create Product"}
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
          {loading && (
            <div className="flex justify-center mt-4">
              <Spin />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProductForm;

import { useRef, useState } from "react";
import Barcode from "react-barcode";
import { useReactToPrint } from "react-to-print";
import useProductStore from "../store/product.store";
import SearchWithSuggestions from "../components/SearchWithSuggestions";
import { Modal, Button, InputNumber, Select, Card, Tag } from "antd";
import { message } from "../utils/antdStatic";
import { PrinterOutlined, PlusOutlined, BarcodeOutlined, CheckCircleFilled } from "@ant-design/icons";

const BarcodePage = () => {
  const { products } = useProductStore();
  const [barcodeList, setBarcodeList] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [modalOpen, setModalOpen] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  // Helper: flatten all barcodes to string for search
  const getProductBarcodes = (product: any) =>
    (product.barcode || []).map((b: any) => String(b));

  // Enhanced onSelect for search
  const handleProductSelect = (prodOrInput: any) => {
    let prod = prodOrInput;
    if (typeof prodOrInput === "string") {
      const exactBarcodeMatch = products.find((p) =>
        getProductBarcodes(p).includes(prodOrInput)
      );
      if (exactBarcodeMatch) {
        prod = exactBarcodeMatch;
      } else {
        const nameMatch = products.find(
          (p) => p.name.toLowerCase() === prodOrInput.toLowerCase()
        );
        if (nameMatch) prod = nameMatch;
      }
    }
    if (prod) {
      setSelectedProduct(prod);
      setSelectedBarcode(getProductBarcodes(prod)[0]);
      setModalOpen(true);
    }
  };

  const handleAddToList = () => {
    if (!selectedProduct || !selectedBarcode || !quantity || quantity < 1)
      return;
    setBarcodeList((prev) => [
      ...prev,
      {
        barcode: selectedBarcode,
        quantity: quantity,
        name: selectedProduct.name,
      },
    ]);
    message.success("Barcode added to list");
    setSelectedProduct(null);
    setSelectedBarcode(null);
    setQuantity(1);
    setModalOpen(false);
  };

  const barcodeGrid = barcodeList.reduce((acc: any[], bar, barIndex) => {
    for (let i = 0; i < bar.quantity; i++) {
      acc.push({
        key: `${bar.barcode}-${barIndex}-${i}`,
        name: bar.name,
        barcode: bar.barcode,
      });
    }
    return acc;
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Barcodes",
  });

  return (
    <main className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <Modal
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={handleAddToList}
          okText="AUTHORIZE LABELS"
          cancelText="CANCEL"
          centered
          className="premium-modal"
          width={420}
          title={
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">
                <BarcodeOutlined className="text-indigo-600 text-xl" />
              </div>
              <div>
                <span className="text-sm font-black text-gray-800 uppercase tracking-widest block">Label Sequencer</span>
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Queue Initialization</span>
              </div>
            </div>
          }
          okButtonProps={{
            className: "bg-indigo-600 border-none font-black rounded-xl h-12 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all uppercase px-8"
          }}
          cancelButtonProps={{
            className: "rounded-xl font-black h-12 border-gray-100 text-gray-400 uppercase"
          }}
        >
          <div className="py-8 space-y-8">
            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Subject Identifier</label>
              <p className="text-base font-black text-gray-800 capitalize leading-tight">{selectedProduct?.name}</p>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3 ml-1">Select Active Index</label>
              <div className="flex flex-wrap gap-2">
                {selectedProduct?.barcode.map((b: string) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBarcode(b)}
                    className={`px-5 py-2.5 rounded-xl border-2 text-[10px] font-black transition-all ${selectedBarcode === b
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105"
                      : "bg-white border-gray-50 text-gray-400 hover:border-indigo-100 hover:text-indigo-600"
                      }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3 ml-1">Label Density (Copies)</label>
              <InputNumber
                min={1}
                value={quantity}
                onChange={(v) => setQuantity(Number(v))}
                className="w-full rounded-2xl h-14 flex items-center font-black border-2 border-gray-50 bg-gray-50/30 px-2"
              />
            </div>
          </div>
        </Modal>

        {/* Header & Terminal Interface */}
        <div className="bg-white rounded-[32px] shadow-sm p-6 sm:p-10 mb-10 border border-gray-100">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
            <div className="w-full lg:max-w-2xl">
              <div className="mb-8">
                <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">Barcode Terminal</h1>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Industrial Label Printing Interface</p>
              </div>
              <div className="relative group">
                <SearchWithSuggestions
                  data={products}
                  onSelect={handleProductSelect}
                  placeholder="Scan or Search Product Registry..."
                  searchKeys={["name", "barcode"]}
                  displayKeys={["name"]}
                  primaryKey="name"
                  autoSelect={true}
                  stockRequired={false}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch lg:items-center gap-4 w-full lg:w-auto">
              <div className="hidden lg:flex flex-col items-end px-8 border-r border-gray-100">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Active Queue</span>
                <span className="text-xl font-black text-indigo-600">{barcodeGrid.length} LABELS</span>
              </div>
              <div className="flex gap-3 flex-1 lg:flex-none">
                <Button
                  onClick={() => setBarcodeList([])}
                  disabled={barcodeGrid.length === 0}
                  className="h-14 flex-1 lg:w-auto px-8 rounded-2xl border-2 border-gray-50 text-[10px] font-black tracking-widest text-gray-400 hover:border-red-100 hover:text-red-500 transition-all uppercase"
                >
                  PURGE
                </Button>
                <Button
                  type="primary"
                  icon={<PrinterOutlined />}
                  onClick={() => handlePrint && handlePrint()}
                  disabled={barcodeGrid.length === 0}
                  className="h-14 flex-1 lg:w-auto px-10 bg-indigo-600 hover:bg-indigo-700 border-none rounded-2xl text-[10px] font-black tracking-widest shadow-xl shadow-indigo-100 transition-all uppercase"
                >
                  EXECUTE PRINT
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Barcode Preview Grid */}
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden relative">
          <div className="p-8 sm:p-12">
            <div className="flex items-center justify-between mb-10 border-b border-gray-50 pb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                  <PrinterOutlined className="text-xl" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800 tracking-tight">Print Layout Preview</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wysiwyg Output Rendering</p>
                </div>
              </div>
              {barcodeGrid.length > 0 && (
                <div className="px-6 py-2 bg-indigo-50 border border-indigo-100 rounded-full">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{barcodeGrid.length} Units Manifested</span>
                </div>
              )}
            </div>

            <div className="overflow-x-auto pb-4 scrollbar-hide">
              <div
                className={`grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 print:bg-white print:shadow-none print:p-0 min-w-[320px]`}
                ref={componentRef}
              >
                {barcodeGrid.length === 0 ? (
                  <div className="col-span-full py-32 bg-gray-50/30 rounded-[32px] border border-dashed border-gray-100 flex flex-col items-center justify-center animate-in fade-in duration-700">
                    <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center mb-6 shadow-sm grayscale opacity-30">
                      <BarcodeOutlined className="text-4xl text-gray-400" />
                    </div>
                    <p className="text-xs font-black text-gray-300 uppercase tracking-[0.3em]">Manifest empty: Waiting for input</p>
                  </div>
                ) : (
                  barcodeGrid.map((item) => (
                    <div
                      key={item.key}
                      className="bg-white rounded-2xl border border-gray-50 flex flex-col items-center justify-center p-5 transition-all hover:shadow-xl hover:shadow-indigo-50 hover:border-indigo-100 group relative"
                    >
                      <span className="text-center capitalize text-[8px] font-black mb-3 text-gray-400 tracking-tighter truncate w-full group-hover:text-indigo-600 transition-colors">
                        {item.name}
                      </span>
                      <div className="group-hover:scale-110 transition-transform duration-500 origin-center bg-white">
                        <Barcode
                          width={1.2}
                          value={item.barcode}
                          height={40}
                          fontSize={9}
                          displayValue={true}
                          background="transparent"
                          font="Inter"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .scrollbar-hide { overflow: visible !important; }
          body { background: white !important; }
          main { padding: 0 !important; margin: 0 !important; }
          .max-w-7xl { max-width: none !important; margin: 0 !important; padding: 0 !important; }
          
          /* Hide everything except the ref */
          body > * { display: none !important; }
          #root { display: none !important; }
          
          /* Show print content */
          .print-area { 
            display: block !important;
            visibility: visible !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
};

export default BarcodePage;

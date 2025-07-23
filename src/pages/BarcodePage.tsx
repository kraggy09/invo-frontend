import { useRef, useState } from "react";
import Barcode from "react-barcode";
import { useReactToPrint } from "react-to-print";
import useProductStore from "../store/product.store";
import SearchWithSuggestions from "../components/SearchWithSuggestions";

const BarcodePage = () => {
  const { products } = useProductStore();
  const [barcodeList, setBarcodeList] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const componentRef = useRef<HTMLDivElement>(null);

  // Helper: flatten all barcodes to string for search
  const getProductBarcodes = (product: any) =>
    (product.barcode || []).map((b: any) => String(b));

  // Enhanced onSelect for search
  const handleProductSelect = (prodOrInput: any) => {
    let prod = prodOrInput;
    // If prodOrInput is a string (from manual input), try to match barcode
    if (typeof prodOrInput === "string") {
      // Try exact barcode match
      const exactBarcodeMatch = products.find((p) =>
        getProductBarcodes(p).includes(prodOrInput)
      );
      if (exactBarcodeMatch) {
        prod = exactBarcodeMatch;
      } else {
        // Try name match (case-insensitive)
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

  // Modal add handler
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
    setSuccessMsg("Added to list!");
    setTimeout(() => setSuccessMsg(""), 1200);
    setSelectedProduct(null);
    setSelectedBarcode(null);
    setQuantity(1);
    setModalOpen(false);
  };

  // Barcode grid for printing
  const barcodeGrid = barcodeList.reduce((acc: any[], bar, barIndex) => {
    let currentIndex = acc.length;
    for (let i = 0; i < bar.quantity; i++) {
      acc.push({
        key: `${bar.barcode}-${barIndex}-${i}`,
        name: bar.name,
        barcode: bar.barcode,
      });
      currentIndex++;
    }
    return acc;
  }, []);

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Barcodes",
  });

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20">
          <div className="bg-white rounded-xl p-6 w-full max-w-xs border border-gray-200">
            <div className="text-center mb-4">
              <div className="text-base font-semibold mb-1 text-gray-800">
                {selectedProduct?.name}
              </div>
            </div>
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-1">Select Barcode</div>
              <div className="flex flex-wrap gap-2">
                {selectedProduct?.barcode.map((b: string) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBarcode(b)}
                    className={`px-2 py-1 rounded border text-xs font-mono transition-all ${
                      selectedBarcode === b
                        ? "bg-green-100 border-green-400 text-green-700"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-green-50"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs text-gray-500">Quantity</span>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="border-b border-gray-300 outline-none px-2 py-1 w-16 text-sm rounded"
              />
            </div>
            <div className="flex justify-between mt-6">
              <button
                className="text-gray-400 hover:text-gray-600 text-xs"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-green-500 hover:bg-green-600 text-white rounded px-4 py-1 text-xs font-semibold"
                onClick={handleAddToList}
                disabled={!selectedBarcode || !quantity}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="w-full max-w-md">
          <SearchWithSuggestions
            data={products}
            onSelect={handleProductSelect}
            placeholder="Search product by name or barcode..."
            searchKeys={["name", "barcode"]}
            displayKeys={["name"]}
            primaryKey="name"
            className=""
            autoSelect={true}
            stockRequired={false}
          />
        </div>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-semibold text-sm"
          onClick={() => handlePrint && handlePrint()}
        >
          Print Barcodes
        </button>
      </div>
      {/* Success message */}
      {successMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-2 rounded shadow z-50 animate-bounce">
          {successMsg}
        </div>
      )}
      {/* Barcode grid for printing */}
      <div
        className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 min-w-[900px] mx-auto print:bg-white print:shadow-none print:p-0"
        ref={componentRef}
      >
        {barcodeGrid.length === 0 && (
          <div className="col-span-full text-center text-gray-400 text-base font-medium py-16">
            No barcodes added yet. Search and add products to print barcodes.
          </div>
        )}
        {barcodeGrid.map((item) => (
          <div
            key={item.key}
            className="bg-white rounded border border-gray-100 flex flex-col items-center justify-center p-3 min-h-[80px]"
          >
            <span className="text-center capitalize text-xs font-medium mb-1 text-gray-700">
              {item.name}
            </span>
            <Barcode
              width={2}
              value={item.barcode}
              height={30}
              fontSize={10}
              displayValue={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarcodePage;

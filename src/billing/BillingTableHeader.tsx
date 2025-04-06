const BillingTableHeader = () => {
  const headers = [
    "Stock",
    "Action",
    "Name",
    "Price",
    "Toggle",
    "Piece",
    "Packet",
    "Box",
    "Discount",
    "Total",
  ];
  return (
    <div className="w-full h-full flex flex-row items-center justify-between">
      {headers.map((header) => (
        <div key={header}>{header}</div>
      ))}
    </div>
  );
};

export default BillingTableHeader;

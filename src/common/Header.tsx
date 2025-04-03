const Header = () => {
  const menuItemClass =
    "flex items-center h-full px-3 hover:cursor-pointer hover:bg-white/20 hover:backdrop-blur-md transition duration-300";

  return (
    <div className="h-12 bg-black text-white w-full flex items-center">
      <div className="w-full h-full max-w-[1320px] mx-auto flex items-center justify-between px-4">
        <h1 className="text-2xl">InvoSync</h1>
        {/* <ul className="flex h-full items-center text-center gap-x-4">
          {[
            "Dashboard",
            "Daily Report",
            "Transaction",
            "Customers",
            "Bills",
            "Products",
            "Barcode",
            "Returns",
            "Categories",
          ].map((item) => (
            <li key={item} className={menuItemClass}>
              {item}
            </li>
          ))}
        </ul> */}
      </div>
    </div>
  );
};

export default Header;

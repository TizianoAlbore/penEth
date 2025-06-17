import React, { Fragment, useContext } from "react";
import { ProductContext } from "./index";
import AddProductModal from "./AddProductModal";
import EditProductModal from "./EditProductModal";

const ProductMenu = (props) => {
  const { dispatch } = useContext(ProductContext);
  const handleBulkUpload = async (e) => {
    console.log("CSV file selected!");
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/product/bulk-upload", {
        method: "POST",
        body: formData,
        headers: {
          // Aggiungi l'header Authorization se serve il token JWT
          // 'Authorization': `Bearer ${token}`
        },
      });

      const result = await response.json();
      alert(result.message || "Caricamento completato.");
    } catch (error) {
      console.error(error);
      alert("Errore nel caricamento del CSV.");
    }
  };

  return (
    <Fragment>
      <div className="col-span-1 flex justify-between items-center">
        <div className="flex items-center">
          {/* It's open the add product modal */}
          <span
            style={{ background: "#303031" }}
            onClick={(e) =>
              dispatch({ type: "addProductModal", payload: true })
            }
            className="rounded-full cursor-pointer p-2 bg-gray-800 flex items-center text-gray-100 text-sm font-semibold uppercase"
          >
            <svg
              className="w-6 h-6 text-gray-100 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
            Add Product
          </span>
          {/* Caricamento CSV */}
          <label className="cursor-pointer p-2 bg-green-600 text-white rounded-md text-sm font-semibold">
            Carica CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleBulkUpload}
              className="hidden"
            />
          </label>
        </div>
        <AddProductModal />
        <EditProductModal />
      </div>
    </Fragment>
  );
};

export default ProductMenu;

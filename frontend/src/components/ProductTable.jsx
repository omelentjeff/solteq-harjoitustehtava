import React, { useState, useEffect } from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Pagination from "@mui/material/Pagination";
import Button from "@mui/material/Button";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchData, fetchSearchData } from "../apiService";
import { CircularProgress, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import Search from "./Search";
import ProductDialog from "./ProductDialog";
import EditDialog from "./EditDialog";
import DeleteDialog from "./DeleteDialog";
import AddProductDialog from "./AddProductDialog";
import { useAuth } from "../hooks/AuthProvider";

const columns = [
  { id: "name", label: "Name", minWidth: 170 },
  { id: "manufacturer", label: "Manufacturer", minWidth: 170 },
  { id: "details", label: "Details", minWidth: 100 },
];

/**
 * ProductTable component that displays a paginated and sortable table of products.
 * Allows for searching, adding, editing, and deleting products.
 * @returns {JSX.Element} The rendered ProductTable component.
 */
export default function ProductTable() {
  const location = useLocation();
  const [data, setData] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(location.state?.page || 1);

  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [query, setQuery] = useState("");
  const { role, token } = useAuth();

  useEffect(() => {
    /**
     * Fetches product data from the API.
     * Depending on whether a search query is present, it fetches either filtered or paginated data.
     * @async
     * @function fetchProductData
     */
    const fetchProductData = async () => {
      setIsLoading(true);
      try {
        let data;
        if (query) {
          console.log("Query is present: " + query);
          data = await fetchSearchData(token, query);
        } else {
          const sortParam = `${sortConfig.key},${sortConfig.direction}`;
          data = await fetchData(token, page - 1, 5, sortParam);
        }
        setData(data.content);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [token, page, sortConfig, query]);

  /**
   * Handles the update of a product in the table.
   * @param {Object} updatedProduct - The updated product data.
   */
  const handleUpdateProduct = (updatedProduct) => {
    setData((prevData) =>
      prevData.map((product) =>
        product.id === updatedProduct.id ? updatedProduct : product
      )
    );
  };

  /**
   * Handles the deletion of a product from the table.
   * @param {number} productId - The ID of the product to delete.
   */
  const handleDeleteProduct = (productId) => {
    setData((prevData) =>
      prevData.filter((product) => product.id !== productId)
    );
  };

  /**
   * Handles adding a new product to the table.
   * @param {Object} newProduct - The new product data to add.
   */
  const handleAddProduct = (newProduct) => {
    setData((prevData) => [newProduct, ...prevData]); // Add new product to the beginning
  };

  /**
   * Resets the search query and sets the page to 1.
   */
  const resetQuery = () => {
    setQuery("");
    setPage(1);
  };

  /**
   * Handles sorting of the table based on the selected column.
   * @param {string} columnId - The ID of the column to sort by.
   */
  const handleSort = (columnId) => {
    let direction = "asc";
    if (sortConfig.key === columnId) {
      direction = sortConfig.direction === "asc" ? "desc" : "asc";
    }
    setSortConfig({ key: columnId, direction });
    setPage(1);
  };

  /**
   * Handles page change event from the pagination component.
   * @param {Object} event - The event object.
   * @param {number} value - The new page number.
   */
  const handleChangePage = (event, value) => {
    console.log("Page changed to:", value);
    setPage(value);
  };

  /**
   * Renders the appropriate sort icon based on the current sort configuration.
   * @param {string} columnId - The ID of the column to check.
   * @returns {JSX.Element} The sort icon element.
   */
  const renderSortIcon = (columnId) => {
    if (sortConfig.key === columnId) {
      return sortConfig.direction === "asc" ? (
        <ArrowDownwardIcon fontSize="small" />
      ) : (
        <ArrowUpwardIcon fontSize="small" />
      );
    } else {
      return <ArrowUpwardIcon fontSize="small" color="disabled" />;
    }
  };

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Search setQuery={setQuery} resetQuery={resetQuery} />
        {role === "ROLE_ADMIN" && (
          <AddProductDialog
            text={"Add new product"}
            onCreate={handleAddProduct}
          />
        )}
      </Box>
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              marginTop: 20,
              height: "100vh",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    {columns.map((column) =>
                      column.id !== "details" ? (
                        <TableCell
                          key={column.id}
                          style={{
                            minWidth: column.minWidth,
                            cursor: "pointer",
                            fontWeight: "bold",
                            backgroundColor: "#f5f5f5",
                            color: "#333",
                            //borderBottom: "2px solid #ddd",
                          }}
                          onClick={() => handleSort(column.id)}
                        >
                          {column.label} {renderSortIcon(column.id)}
                        </TableCell>
                      ) : (
                        <TableCell
                          key={column.id}
                          style={{
                            minWidth: column.minWidth,
                            fontWeight: "bold",
                            backgroundColor: "#f5f5f5",
                            color: "#333",
                          }}
                        >
                          {column.label}
                        </TableCell>
                      )
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow hover role="checkbox" tabIndex={-1} key={index}>
                      {columns.map((column) => (
                        <TableCell key={column.id}>
                          {column.id !== "details" ? (
                            row[column.id]
                          ) : (
                            <Box sx={{ display: "flex", gap: "10px" }}>
                              <ProductDialog
                                product={row}
                                text="Show Details"
                              />
                              {role === "ROLE_ADMIN" && (
                                <>
                                  <EditDialog
                                    product={row}
                                    text="Edit"
                                    onUpdate={handleUpdateProduct}
                                  />
                                  <DeleteDialog
                                    product={row}
                                    onDelete={handleDeleteProduct}
                                  />
                                </>
                              )}
                            </Box>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handleChangePage}
              color="primary"
              sx={{ display: "flex", justifyContent: "center", padding: 2 }}
            />
          </>
        )}
      </Paper>
    </>
  );
}

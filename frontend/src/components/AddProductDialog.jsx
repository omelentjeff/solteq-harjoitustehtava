import React, { useState } from "react";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Typography from "@mui/material/Typography";
import {
  Box,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
} from "@mui/material";
import { saveProductDetails } from "../apiService";
import { useAuth } from "../hooks/AuthProvider";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

const NUTRITIONAL_FACTS = [
  { label: "Calories", key: "calories", unit: "kcal" },
  { label: "Kilojoules", key: "kilojoules", unit: "kJ" },
  { label: "Fat", key: "fat", unit: "g" },
  { label: "Carbohydrates", key: "carbohydrates", unit: "g" },
  { label: "Sugars", key: "sugars", unit: "g" },
  { label: "Polyols", key: "polyols", unit: "g" },
  { label: "Fibers", key: "fibers", unit: "g" },
  { label: "Protein", key: "protein", unit: "g" },
  { label: "Sodium", key: "sodium", unit: "g" },
  { label: "Vitamin C", key: "vitaminC", unit: "mg" },
  { label: "Calcium", key: "calcium", unit: "mg" },
];

/**
 * AddProductDialog Component - A dialog for adding new product details including nutritional facts.
 *
 * @param {Object} props - The props for the component.
 * @param {string} props.text - The text to display on the button that opens the dialog.
 * @param {function} props.onCreate - Callback function to be called when a new product is successfully created.
 *
 * @returns {JSX.Element} The rendered dialog component.
 */
export default function AddProductDialog({ text, onCreate }) {
  const [open, setOpen] = useState(false);
  const [productDetails, setProductDetails] = useState({
    name: "",
    manufacturer: "",
    weight: "",
    nutritionalFact: {},
    photoUrl: null,
    gtin: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const { token } = useAuth();

  /**
   * Opens the dialog.
   */

  const handleClickOpen = () => {
    setOpen(true);
  };

  /**
   * Closes the dialog and resets the form fields.
   */
  const handleClose = () => {
    setOpen(false);
    setProductDetails({
      name: "",
      manufacturer: "",
      weight: "",
      nutritionalFact: {},
      photoUrl: null,
    });
    setSelectedImage(null);
    setTabIndex(0);
  };

  /**
   * Handles tab changes.
   *
   * @param {Object} event - The event object.
   * @param {number} newValue - The new tab index.
   */
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  /**
   * Handles input changes for the product details and nutritional facts.
   *
   * @param {Object} e - The event object.
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Check if the input belongs to nutritional facts
    if (NUTRITIONAL_FACTS.some((fact) => fact.key === name)) {
      setProductDetails((prev) => ({
        ...prev,
        nutritionalFact: {
          ...prev.nutritionalFact,
          [name]: value, // Update the specific nutritional fact
        },
      }));
    } else {
      setProductDetails((prev) => ({
        ...prev,
        [name]: value, // Update other product details
      }));
    }

    // Clear the error for the modified field
    setFormErrors((prevErrors) => {
      const newErrors = { ...prevErrors };

      // For normal fields
      if (newErrors[name]) {
        delete newErrors[name];
      }

      // For nested nutritional facts
      if (NUTRITIONAL_FACTS.some((fact) => fact.key === name)) {
        const parent = "nutritionalFact";
        if (newErrors[parent] && newErrors[parent][name]) {
          delete newErrors[parent][name];
        }
      }

      return newErrors;
    });
  };

  /**
   * Handles saving the product details.
   *
   * @returns {Promise<void>} A promise that resolves when the save operation is complete.
   */
  const handleSave = async () => {
    const productPayload = {
      name: productDetails.name,
      manufacturer: productDetails.manufacturer,
      weight: productDetails.weight,
      nutritionalFact: productDetails.nutritionalFact,
      gtin: productDetails.gtin,
    };
    console.log("Product Payload:", productPayload);

    const formData = new FormData();
    const blob = new Blob([JSON.stringify(productPayload)], {
      type: "application/json", // make it applicxation/json so multipart/form-data can be used
    });
    formData.append("product", blob);
    if (selectedImage) {
      formData.append("image", productDetails.photoUrl);
    }

    try {
      const response = await saveProductDetails(token, formData);
      console.log("New Product Added Response:", response.data);
      onCreate(response.data);
      handleClose();
    } catch (error) {
      if (error.response && error.response.status === 400) {
        const { details } = error.response.data;
        const validationErrors = {};
        let hasProductDetailsErrors = false;
        let hasNutritionalFactsErrors = false;

        // Organize errors into product details and nutritional facts
        details.forEach((errorMessage) => {
          const [field, message] = errorMessage.split(": ");
          if (field.includes(".")) {
            const [parent, child] = field.split(".");
            if (!validationErrors[parent]) validationErrors[parent] = {};
            validationErrors[parent][child] = message;

            // Check if the error is related to nutritional facts
            if (parent === "nutritionalFact") hasNutritionalFactsErrors = true;
          } else {
            validationErrors[field] = message;

            // Errors in product details (Tab 1)
            hasProductDetailsErrors = true;
          }
        });

        // Set form errors for displaying in the form
        setFormErrors(validationErrors);

        // If there are errors in product details (Tab 1), stay on or switch to Tab 1
        if (hasProductDetailsErrors) {
          setTabIndex(0); // Show Tab 1 (Product Details)
        } else if (hasNutritionalFactsErrors) {
          // If no errors in Product Details but errors exist in Nutritional Facts, switch to Tab 2
          setTabIndex(1);
        }
      } else {
        console.error("Error updating product:", error);
      }
    }
  };

  /**
   * Handles image changes when a user uploads a new image.
   *
   * @param {Object} e - The event object.
   */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setProductDetails((prev) => ({
        ...prev,
        photoUrl: file,
      }));
    }
  };

  return (
    <React.Fragment>
      <Button variant="outlined" onClick={handleClickOpen}>
        {text}
      </Button>
      <BootstrapDialog
        onClose={handleClose}
        aria-labelledby="customized-dialog-title"
        open={open}
        fullWidth={true}
        maxWidth="md"
      >
        {isLoading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{ height: "300px" }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            <DialogTitle
              sx={{
                m: 0,
                p: 2,
                textAlign: "center",
                fontWeight: "bold",
                fontSize: 24,
                color: "#333",
              }}
              id="customized-dialog-title"
            >
              Add New Product
            </DialogTitle>

            <IconButton
              aria-label="close"
              onClick={handleClose}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>

            <Tabs
              value={tabIndex}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              centered
            >
              <Tab label="Product Details" />
              <Tab label="Nutritional Facts / 100g" />
            </Tabs>

            <DialogContent dividers>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid
                  item
                  xs={12}
                  md={6}
                  display="flex"
                  justifyContent="center"
                >
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                  >
                    {selectedImage ? (
                      <img
                        src={selectedImage}
                        alt="New Product"
                        style={{
                          width: "70%",
                          height: "auto",
                          maxHeight: "300px",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    ) : (
                      <Typography
                        variant="body1"
                        color="textSecondary"
                      ></Typography>
                    )}
                    <input
                      accept="image/*"
                      style={{ display: "none" }}
                      id="image-upload"
                      type="file"
                      onChange={handleImageChange}
                    />
                    <label htmlFor="image-upload">
                      <Button
                        variant="contained"
                        component="span"
                        color="primary"
                        sx={{ mt: 2 }}
                      >
                        Upload Image
                      </Button>
                    </label>
                  </Box>
                </Grid>

                <Grid
                  item
                  xs={12}
                  md={6}
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  {tabIndex === 0 && (
                    <Box textAlign="center">
                      <TextField
                        label="Name"
                        name="name"
                        value={productDetails.name || ""}
                        onChange={handleInputChange}
                        error={!!formErrors.name}
                        helperText={formErrors.name || ""}
                        fullWidth
                        margin="normal"
                      />
                      <TextField
                        label="Manufacturer"
                        name="manufacturer"
                        value={productDetails.manufacturer || ""}
                        onChange={handleInputChange}
                        error={!!formErrors.manufacturer}
                        helperText={formErrors.manufacturer || ""}
                        fullWidth
                        margin="normal"
                      />
                      <TextField
                        label="Weight (g)"
                        name="weight"
                        type="number"
                        value={productDetails.weight || ""}
                        onChange={handleInputChange}
                        error={!!formErrors.weight}
                        helperText={formErrors.weight || ""}
                        fullWidth
                        margin="normal"
                      />
                      <TextField
                        label="Gtin-code"
                        name="gtin"
                        value={productDetails.gtin || ""}
                        onChange={handleInputChange}
                        error={!!formErrors.gtin}
                        helperText={formErrors.gtin || ""}
                        fullWidth
                        margin="normal"
                      />
                    </Box>
                  )}
                  {tabIndex === 1 && (
                    <Box textAlign="center">
                      <Box sx={{ textAlign: "left", margin: 0, padding: 0 }}>
                        {NUTRITIONAL_FACTS.map((fact) => (
                          <TextField
                            key={fact.key}
                            label={fact.label}
                            name={fact.key}
                            type="number"
                            value={
                              productDetails.nutritionalFact[fact.key] || ""
                            }
                            onChange={handleInputChange}
                            error={!!formErrors.nutritionalFact?.[fact.key]}
                            helperText={
                              formErrors.nutritionalFact?.[fact.key] || ""
                            }
                            margin="normal"
                            fullWidth
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </DialogContent>

            <Box display="flex" justifyContent="center" sx={{ mb: 2 }}>
              <Button variant="contained" color="primary" onClick={handleSave}>
                Add Product
              </Button>
            </Box>
          </>
        )}
      </BootstrapDialog>
    </React.Fragment>
  );
}

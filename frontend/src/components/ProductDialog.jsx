import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Typography from "@mui/material/Typography";
import { Box, Grid, CircularProgress } from "@mui/material";
import { fetchSingleData } from "../apiService";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

export default function StationDialog({ product, text }) {
  const [open, setOpen] = useState(false);
  const [productDetails, setProductDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleClickOpen = async () => {
    setOpen(true);
    setIsLoading(true);

    try {
      const details = await fetchSingleData(product.id);
      setProductDetails(details);
    } catch (error) {
      console.error("Failed to fetch product details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setProductDetails(null);
  };

  const BACKEND_URL = "http://localhost:8080/";

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
          productDetails && (
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
                {productDetails.name}
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

              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" color="textSecondary">
                      {productDetails.description}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    {productDetails.photoUrl && (
                      <img
                        src={`${BACKEND_URL}${productDetails.photoUrl}`}
                        alt={productDetails.name}
                        style={{
                          width: "100%",
                          height: "auto",
                          maxHeight: "300px",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    )}
                  </Grid>
                </Grid>
              </DialogContent>
            </>
          )
        )}
      </BootstrapDialog>
    </React.Fragment>
  );
}

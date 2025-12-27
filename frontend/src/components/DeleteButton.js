import React, { useState, useContext } from 'react';
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const DeleteButton = ({ scanId, onDeleteSuccess, onError }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      await axios.delete(`/api/scan-results/${scanId}`, {
        params: { token },
      });

      setOpen(false);
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Delete failed';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <IconButton
        size="small"
        color="error"
        onClick={handleOpen}
        title="Delete scan"
      >
        <DeleteIcon />
      </IconButton>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Delete Scan</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <DialogContentText>
            Are you sure you want to delete this scan? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeleteButton;

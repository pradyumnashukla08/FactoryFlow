import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Save as SaveIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import toast from "react-hot-toast";

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your profile and factory settings
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab icon={<PersonIcon />} iconPosition="start" label="Profile" />
        <Tab icon={<LockIcon />} iconPosition="start" label="Security" />
      </Tabs>

      {tab === 0 && <ProfileTab user={user} updateProfile={updateProfile} />}
      {tab === 1 && <SecurityTab />}
    </Box>
  );
};

const ProfileTab = ({ user, updateProfile }) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    factory_name: user?.factory_name || "",
    city: user?.city || "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccess("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    setLoading(true);
    try {
      await updateProfile(formData);
      setSuccess("Profile updated successfully!");
      toast.success("Profile updated");
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
          Profile Information
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Factory Name"
                name="factory_name"
                value={formData.factory_name}
                onChange={handleChange}
                placeholder="Your factory or company name"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              disabled={loading}
              sx={{ minWidth: 140 }}
            >
              Save Changes
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const SecurityTab = () => {
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPasswords, setShowPasswords] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccess("");
    setError("");
  };

  const toggleShow = (field) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.current_password || !formData.new_password) {
      setError("Please fill in all fields");
      return;
    }
    if (formData.new_password.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (formData.new_password !== formData.confirm_password) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password,
      });
      setSuccess("Password changed successfully!");
      toast.success("Password changed");
      setFormData({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
          Change Password
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400 }}>
          <TextField
            fullWidth
            label="Current Password"
            name="current_password"
            type={showPasswords.current ? "text" : "password"}
            value={formData.current_password}
            onChange={handleChange}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => toggleShow("current")} edge="end" size="small">
                    {showPasswords.current ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="New Password"
            name="new_password"
            type={showPasswords.new ? "text" : "password"}
            value={formData.new_password}
            onChange={handleChange}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => toggleShow("new")} edge="end" size="small">
                    {showPasswords.new ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            name="confirm_password"
            type="password"
            value={formData.confirm_password}
            onChange={handleChange}
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LockIcon />}
            disabled={loading}
            sx={{ minWidth: 160 }}
          >
            Change Password
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Settings;

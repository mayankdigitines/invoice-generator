export const validateInvoiceForm = (customer, items) => {
  const errors = {};

  // --- Customer Validation ---
  
  // Name
  if (!customer.name || customer.name.trim().length < 2) {
    errors.customerName = 'Customer name must be at least 2 characters.';
  }

  // Phone (Expecting 10 digits for India context, or just general numeric)
  const phoneRegex = /^\d{10}$/;
  if (!customer.phone) {
    errors.customerPhone = 'Phone number is required.';
  } else if (!phoneRegex.test(customer.phone)) {
    errors.customerPhone = 'Phone number must be  10 digits.';
  }

  // Address (Optional, but if exists, meaningful)
  if (customer.address && customer.address.trim().length < 5) {
    errors.customerAddress = 'Address is too short.';
  }

  // --- Items Validation ---
  if (!items || items.length === 0) {
    errors.items = 'At least one item is required.';
  } else {
    items.forEach((item, index) => {
      // Item Name
      if (!item.name || item.name.trim() === '') {
        errors[`item_${index}_name`] = 'Required';
      }

      // Quantity
      if (!item.quantity || item.quantity <= 0) {
        errors[`item_${index}_quantity`] = 'Min 1';
      }

      // Price
      if (item.price === undefined || item.price < 0) {
        errors[`item_${index}_price`] = 'Invalid';
      }

      // GST Rate
      if (item.gstRate < 0 || item.gstRate > 100) {
        errors[`item_${index}_gst`] = '0-100';
      }

      // Discount
      if (item.discount < 0 || item.discount > 100) {
        errors[`item_${index}_discount`] = '0-100';
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateBusinessForm = (data) => {
  const errors = {};

  // Name
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Business name must be at least 2 characters.';
  }

  // Address
  if (!data.address || data.address.trim().length < 5) {
    errors.address = 'Address must be at least 5 characters.';
  }

  // Email
  if (data.email && data.email.trim() !== "") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Invalid email address.';
    }
  }

  // Phone
  if (data.phone && data.phone.trim() !== "") {
    if (!/^\d{10}$/.test(data.phone)) {
      errors.phone = 'Phone number must be exactly 10 digits.';
    }
  }

  // GST Number
  if (data.gstNumber && data.gstNumber.trim() !== "") {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(data.gstNumber)) {
      errors.gstNumber = 'Invalid GST Number format.';
    }
  }

  // Logo URL
  if (data.logoUrl && data.logoUrl.trim() !== "") {
    try {
      new URL(data.logoUrl);
    } catch (_) {
      errors.logoUrl = 'Invalid URL format.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

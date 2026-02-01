import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';

// Define Corporate Colors & Styles - Professional Black & Gray
const PRIMARY_COLOR = '#000000';
const SECONDARY_COLOR = '#333333';
const BORDER_COLOR = '#000000'; // Strict black borders for formal look

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#000000',
    lineHeight: 1.3,
  },

  // Font Styles for bold text (React PDF handles weights differently sometimes)
  textBold: {
    fontFamily: 'Helvetica-Bold',
    fontWeight: 'bold',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    width: '60%',
  },
  headerRight: {
    width: '40%',
    textAlign: 'right',
  },
  logo: {
    width: 120,
    height: 60,
    objectFit: 'contain',
    marginBottom: 5,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 9,
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 10,
    textDecoration: 'underline',
  },

  // Grid Table Style
  tableContainer: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginTop: 10,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    backgroundColor: '#e0e0e0', // Light gray background for header
    alignItems: 'center',
    height: 20,
    textAlign: 'center',
    flexGrow: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    alignItems: 'center',
    minHeight: 20,
  },
  tableFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    minHeight: 20,
  },

  // Columns with Vertical Borders
  // Helper to apply border right
  colBase: {
    borderRightWidth: 1,
    borderRightColor: BORDER_COLOR,
    height: '100%',
    padding: 3,
    display: 'flex',
    justifyContent: 'center',
  },
  colIndex: { width: '5%', textAlign: 'center' },
  colDesc: { width: '30%', textAlign: 'left' },
  colQty: { width: '8%', textAlign: 'center' },
  colRate: { width: '12%', textAlign: 'right' },
  colDiscount: { width: '12%', textAlign: 'right' },
  colTaxable: { width: '13%', textAlign: 'right' },
  colTax: { width: '10%', textAlign: 'right' },
  colTotal: { width: '10%', textAlign: 'right', borderRightWidth: 0 }, // Last column no border right

  textSmall: { fontSize: 7 },

  // Client Info Box
  clientSection: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 10,
  },
  billToBox: {
    width: '100%',
    padding: 10,
  },

  // Totals Area
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  totalsTable: {
    minWidth: '40%',
    maxWidth: '50%',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 4,
    paddingRight: 4,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 4,
    paddingRight: 4,
    backgroundColor: '#e0e0e0',
    fontWeight: 'bold',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    marginBottom: 2,
  },
  signatureBlock: {
    marginTop: 40,
    textAlign: 'right',
    paddingRight: 20,
  },
});

// Helper to format currency
const formatCurrency = (amount) => {
  return (
    amount?.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) || '0.00'
  );
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  // const time = date.toTimeString().split(' ')[0]; // HH:MM AM/PM
  const time = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${day}/${month}/${year} ${time}`;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getProxiedLogoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  return `${API_URL}/proxy/image?url=${encodeURIComponent(url)}`;
};

export const InvoicePDF = ({ invoice, business }) => {
  const isUpdated =
    invoice.updatedAt &&
    invoice.createdAt &&
    new Date(invoice.updatedAt).getTime() >
      new Date(invoice.createdAt).getTime();

  // Pre-calculate line item details to ensure consistency
  // Assuming input: item.price (unit), item.quantity, item.discount (%), item.gstRate (%), item.amount (total)
  const processedItems = invoice.items.map((item) => {
    const grossAmount = item.price * item.quantity;
    const discountAmount = (grossAmount * (item.discount || 0)) / 100;
    const taxableValue = grossAmount - discountAmount;
    const taxAmount = (taxableValue * (item.gstRate || 0)) / 100;

    // We trust the calc here, but relying on item.amount for final check
    return {
      ...item,
      grossAmount,
      discountAmount,
      taxableValue,
      taxAmount,
      // For row display, we might want to recalculate final amount to be safe or use provided
      finalAmount: taxableValue + taxAmount,
    };
  });

  // Calculate Column Totals
  const totalQty = processedItems.reduce(
    (sum, item) => sum + Number(item.quantity),
    0,
  );

  const totalGross = processedItems.reduce(
    (sum, item) => sum + item.grossAmount,
    0,
  );

  const totalDiscount = processedItems.reduce(
    (sum, item) => sum + item.discountAmount,
    0,
  );

  const totalTaxable = processedItems.reduce(
    (sum, item) => sum + item.taxableValue,
    0,
  );
  const totalTax = processedItems.reduce(
    (sum, item) => sum + item.taxAmount,
    0,
  );
  const totalAmount = processedItems.reduce(
    (sum, item) => sum + item.finalAmount,
    0,
  );

  // Overall Discount Calculation
  const overallDiscountRate = invoice.overallDiscount || 0;
  const overallDiscountAmount = (totalAmount * overallDiscountRate) / 100;
  const finalGrandTotal = totalAmount - overallDiscountAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {business?.logoUrl && (
              <Image
                style={styles.logo}
                src={getProxiedLogoUrl(business.logoUrl)}
              />
            )}
            <Text style={styles.companyName}>{business?.name}</Text>
            <Text style={styles.companyDetails}>{business?.address}</Text>
            <Text style={styles.companyDetails}>{business?.email}</Text>
            <Text style={styles.companyDetails}>{business?.phone}</Text>
            {business?.gstNumber && (
              <Text style={[styles.companyDetails, { fontWeight: 'bold' }]}>
                GSTIN: {business.gstNumber}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={{ fontWeight: 'bold' }}>
              Invoice #: {invoice.invoiceNumber}
            </Text>
            <Text>Date: {formatDate(invoice.createdAt)}</Text>
            {isUpdated && (
              <Text>Updated: {formatDate(invoice.updatedAt)}</Text>
            )}
          </View>
        </View>

        {/* Client Info Grid */}
        <View style={styles.clientSection}>
          <View style={styles.billToBox}>
            <Text
              style={{
                fontWeight: 'bold',
                borderBottomWidth: 1,
                borderBottomColor: '#ccc',
                marginBottom: 5,
                paddingBottom: 2,
              }}
            >
              BILLED TO
            </Text>
            <Text style={{ fontWeight: 'bold', fontSize: 10 }}>
              {invoice.customer?.name}
            </Text>
            <Text>{invoice.customer?.address}</Text>
            {invoice.customer?.phone && (
              <Text>Phone: {invoice.customer.phone}</Text>
            )}
            {invoice.customer?.email && (
              <Text>Email: {invoice.customer.email}</Text>
            )}
          </View>
        </View>

        {/* Detailed Table */}
        <View style={styles.tableContainer}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.colBase, styles.colIndex]}>
              <Text style={styles.textBold}>#</Text>
            </View>
            <View style={[styles.colBase, styles.colDesc]}>
              <Text style={styles.textBold}>Description</Text>
            </View>
            <View style={[styles.colBase, styles.colQty]}>
              <Text style={styles.textBold}>Qty</Text>
            </View>
            <View style={[styles.colBase, styles.colRate]}>
              <Text style={styles.textBold}>Rate</Text>
            </View>
            <View style={[styles.colBase, styles.colDiscount]}>
              <Text style={styles.textBold}>Discount</Text>
            </View>
            <View style={[styles.colBase, styles.colTaxable]}>
              <Text style={styles.textBold}>Taxable Val</Text>
            </View>
            <View style={[styles.colBase, styles.colTax]}>
              <Text style={styles.textBold}>Tax</Text>
            </View>
            <View style={[styles.colBase, styles.colTotal]}>
              <Text style={styles.textBold}>Total</Text>
            </View>
          </View>

          {/* Rows */}
          {processedItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.colBase, styles.colIndex]}>
                <Text>{index + 1}</Text>
              </View>
              <View style={[styles.colBase, styles.colDesc]}>
                <Text>{item.itemName}</Text>
                {item.itemDescription && (
                  <Text style={{ fontSize: 7, color: '#555', marginTop: 2 }}>
                    {item.itemDescription}
                  </Text>
                )}
              </View>
              <View style={[styles.colBase, styles.colQty]}>
                <Text>{item.quantity}</Text>
              </View>
              <View style={[styles.colBase, styles.colRate]}>
                <Text>{formatCurrency(item.price)}</Text>
              </View>
              <View style={[styles.colBase, styles.colDiscount]}>
                <Text>{formatCurrency(item.discountAmount)}</Text>
                {item.discount > 0 ? (
                  <Text style={styles.textSmall}>({item.discount}%)</Text>
                ) : null}
              </View>
              <View style={[styles.colBase, styles.colTaxable]}>
                <Text>{formatCurrency(item.taxableValue)}</Text>
              </View>
              <View style={[styles.colBase, styles.colTax]}>
                <Text>{formatCurrency(item.taxAmount)}</Text>
                <Text style={styles.textSmall}>({item.gstRate}%)</Text>
              </View>
              <View style={[styles.colBase, styles.colTotal]}>
                <Text>{formatCurrency(item.finalAmount)}</Text>
              </View>
            </View>
          ))}

          {/* Total Row */}
          <View style={styles.tableFooterRow}>
            <View style={[styles.colBase, styles.colIndex]}></View>
            <View style={[styles.colBase, styles.colDesc]}>
              <Text style={{ fontWeight: 'bold', textAlign: 'right' }}>
                Total:
              </Text>
            </View>
            <View style={[styles.colBase, styles.colQty]}>
              <Text style={styles.textBold}>{totalQty}</Text>
            </View>
            <View style={[styles.colBase, styles.colRate]}></View>
            <View style={[styles.colBase, styles.colDiscount]}></View>
            <View style={[styles.colBase, styles.colTaxable]}>
              <Text style={styles.textBold}>
                {formatCurrency(totalTaxable)}
              </Text>
            </View>
            <View style={[styles.colBase, styles.colTax]}>
              <Text style={styles.textBold}>{formatCurrency(totalTax)}</Text>
            </View>
            <View style={[styles.colBase, styles.colTotal]}>
              <Text style={styles.textBold}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Summary & Signatures */}
        <View style={styles.summarySection}>
          <View style={styles.totalsTable}>
            <View style={styles.totalRow}>
              <Text>Total Gross Amount:</Text>
              <Text>{formatCurrency(totalGross)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Total Discount:</Text>
              <Text>- {formatCurrency(totalDiscount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.textBold}>Taxable Amount:</Text>
              <Text style={styles.textBold}>
                {formatCurrency(totalTaxable)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Total Tax:</Text>
              <Text>{formatCurrency(totalTax)}</Text>
            </View>
            {overallDiscountRate > 0 && (
              <View style={styles.totalRow}>
                <Text>Overall Discount ({overallDiscountRate}%):</Text>
                <Text>- {formatCurrency(overallDiscountAmount)}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.textBold}>GRAND TOTAL:</Text>
              <Text style={styles.textBold}>
                Rs. {formatCurrency(finalGrandTotal)}
              </Text>
            </View>
          </View>
        </View>

        {/* <View style={styles.signatureBlock}>
          <Text style={{ fontWeight: 'bold', marginBottom: 30 }}>
            For {business.name}
          </Text>
          <Text>_____________________________</Text>
          <Text style={{ fontWeight: 'bold' }}>Authorized Signatory</Text>
        </View> */}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is a Computer Generated Invoice.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

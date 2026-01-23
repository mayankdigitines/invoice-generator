import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';

Font.register({
  family: 'Helvetica',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf',
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf',
      fontWeight: 'bold',
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
    lineHeight: 1.5,
  },

  // Header with Logo
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  logoSection: { flexDirection: 'row', alignItems: 'flex-start' },
  logo: { width: 60, height: 60, marginRight: 15, objectFit: 'contain' },

  companyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 6,
  },
  companyDetails: { textAlign: 'right', fontSize: 9, color: '#666' },

  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  billTo: { width: '50%' },
  billToLabel: {
    fontSize: 8,
    color: '#888',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  invoiceData: { textAlign: 'right' },
  invoiceTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },

  table: { width: 'auto', marginBottom: 20 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  colItem: { width: '40%' },
  colQty: { width: '10%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colDisc: { width: '10%', textAlign: 'right' },
  colTax: { width: '10%', textAlign: 'right' },
  colTotal: { width: '15%', textAlign: 'right' },
  bold: { fontWeight: 'bold' },

  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  totalsBox: { width: '40%' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderColor: '#2563eb',
    paddingTop: 8,
    marginTop: 4,
    fontWeight: 'bold',
    fontSize: 12,
  },

  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#aaa',
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingTop: 10,
  },
});

export const InvoicePDF = ({ invoice, business }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header: Logo + Company Info */}
      <View style={styles.header}>
        <View style={styles.logoSection}>
          {/* Render Logo if URL exists */}
          {business.logoUrl && (
            <Image style={styles.logo} src={business.logoUrl} />
          )}
          <View>
            <Text style={styles.companyTitle}>
              {business.name || 'Company Name'}
            </Text>
            <Text>GST: {business.gstNumber}</Text>
          </View>
        </View>

        <View style={styles.companyDetails}>
          <Text>{business.address}</Text>
          <Text>{business.phone}</Text>
          <Text>{business.email}</Text>
        </View>
      </View>

      {/* Invoice Meta Info */}
      <View style={styles.metaContainer}>
        <View style={styles.billTo}>
          <Text style={styles.billToLabel}>Bill To:</Text>
          <Text style={[styles.bold, { fontSize: 12 }]}>
            {invoice.customer.name}
          </Text>
          <Text>{invoice.customer.address}</Text>
          <Text>Phone: {invoice.customer.phone}</Text>
        </View>
        <View style={styles.invoiceData}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text>#{invoice.invoiceNumber}</Text>
          <Text style={{ marginTop: 4 }}>
            Date: {new Date(invoice.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Table Headers */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.colItem, styles.bold]}>Item Description</Text>
          <Text style={[styles.colQty, styles.bold]}>Qty</Text>
          <Text style={[styles.colPrice, styles.bold]}>Price</Text>
          <Text style={[styles.colDisc, styles.bold]}>Disc</Text>
          <Text style={[styles.colTax, styles.bold]}>Tax</Text>
          <Text style={[styles.colTotal, styles.bold]}>Amount</Text>
        </View>

        {/* Table Rows */}
        {invoice.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.colItem}>{item.itemName}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>{item.price.toFixed(2)}</Text>
            <Text style={styles.colDisc}>{item.discount}%</Text>
            <Text style={styles.colTax}>{item.gstRate}%</Text>
            <Text style={styles.colTotal}>{item.amount.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Totals Section */}
      <View style={styles.totalsContainer}>
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{invoice.totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Tax Amount:</Text>
            <Text>{invoice.taxAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>Grand Total:</Text>
            <Text>Rs. {invoice.grandTotal.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.footer}>Thank you for your business!</Text>
    </Page>
  </Document>
);

// components/pdf/InvoicePdf.jsx
import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

// ✅ Styles
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  logo: {
    width: 85,
    height: 85,
    margin: 'auto',
  },
  title: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  label: {
    fontWeight: 'bold',
  },
  table: {
    marginTop: 10,
    border: '1pt solid black',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1pt solid black',
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #ccc',
  },
  cell: {
    padding: 4,
    flex: 1,
  },
});

export default function PDFInvoice({ data }) {
  return (
    <Document>
      <Page1 data={data} />
    </Document>
  );
};

function Page1({ data }) {
  const {
    clientName,
    age,
    address,
    city,
    phone,
    invoiceNo,
    date,
    products = [],
    subtotal,
    discount,
    total,
    logoUrl,
    coachName,
    coachPhone,
    coachCity,
  } = data
  const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 0), 0);

  return <Page size="A4" style={styles.page}>
    {/* Logo */}
    {logoUrl && <Image src={logoUrl} style={styles.logo} />}

    {/* Title */}
    <Text style={styles.title}>INVOICE</Text>

    {/* Invoice Info */}
    <View style={styles.row}>
      <Text><Text style={styles.label}>Bill No: </Text>{invoiceNo}</Text>
      <Text><Text style={styles.label}>Date: </Text>{date}</Text>
    </View>

    {/* Coach Info */}
    <View style={styles.row}>
      <Text><Text style={styles.label}>City: </Text>{coachCity}</Text>
      <Text><Text style={styles.label}>Phone: </Text>{coachPhone}</Text>
    </View>

    {/* Client Info */}
    <View style={{ marginTop: 10, border: '1pt solid black', padding: 5 }}>
      <Text><Text style={styles.label}>Customer: </Text>{clientName}</Text>
      <Text><Text style={styles.label}>Age: </Text>{age}</Text>
      <Text><Text style={styles.label}>Address: </Text>{address}</Text>
      <Text><Text style={styles.label}>Phone: </Text>{phone}</Text>
    </View>

    {/* Product Table */}
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.cell, { flex: 0.5 }]}>Sr.</Text>
        <Text style={styles.cell}>Product</Text>
        <Text style={styles.cell}>Qty</Text>
        <Text style={styles.cell}>Price</Text>
        <Text style={styles.cell}>Amount</Text>
      </View>
      {products.map((p, index) => (
        <View style={styles.tableRow} key={index}>
          <Text style={[styles.cell, { flex: 0.5 }]}>{index + 1}</Text>
          <Text style={styles.cell}>{p.productName}</Text>
          <Text style={styles.cell}>{p.quantity}</Text>
          <Text style={styles.cell}>{p.price}</Text>
          <Text style={styles.cell}>{(p.price * p.quantity).toFixed(2)}</Text>
        </View>
      ))}
      {/* Totals */}
      <View style={styles.tableRow}>
        <Text style={[styles.cell, { flex: 3 }]}>Subtotal</Text>
        <Text style={[styles.cell, { flex: 2 }]}>{subtotal}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={[styles.cell, { flex: 3 }]}>Discount</Text>
        <Text style={[styles.cell, { flex: 2 }]}>{discount}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={[styles.cell, { flex: 3 }]}>Total</Text>
        <Text style={[styles.cell, { flex: 2 }]}>{total}</Text>
      </View>
    </View>

    {/* Footer */}
    <View style={{ marginTop: 20 }}>
      <Text>
        This invoice is automatically generated. Please verify all details.
      </Text>
      <Text style={{ textAlign: 'center', marginTop: 10 }}>
        Thank you for your trust and support!
      </Text>
    </View>
    {products.map((product, index) => (
      <View key={index} style={styles.row}>
        <Text style={styles.cell}>{index + 1}</Text>
        <View style={[styles.cell, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
          {product.productImage && (
            <Image
              src={product.productImage}
              style={{ width: 30, height: 30, marginRight: 6 }}
            />
          )}
          <Text>{product.productName}</Text>
        </View>
        <Text style={styles.cell}>{product.quantity}</Text>
        <Text style={styles.cell}>₹{product.price}</Text>
        <Text style={styles.cell}>₹{product.quantity * product.price}</Text>
      </View>
    ))}
  </Page>
}
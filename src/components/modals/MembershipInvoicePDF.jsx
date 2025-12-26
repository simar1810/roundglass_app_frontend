import React from "react";
import {
  Document,
  Page,
  PDFViewer,
  StyleSheet,
  Text,
  View,
  Font,
  Image
} from "@react-pdf/renderer";

Font.register({
  family: "Roboto",
  src: "/fonts/Noto-Sans-Devnagiri.ttf"
});

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: "Roboto",
    fontSize: 10,
    color: "#0f172a",
    backgroundColor: "#fff"
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12
  },
  logo: {
    width: 80,
    height: 50,
    objectFit: "contain"
  },
  companyInfo: {
    flex: 1,
    alignItems: "flex-end"
  },
  companyName: {
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: 0.5
  },
  companyAddress: {
    fontSize: 9,
    lineHeight: 1.4,
    marginTop: 2
  },
  taxInvoiceBanner: {
    marginTop: 14,
    // backgroundColor: "#0d4ed8",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "flex-start"
  },
  taxInvoiceLabel: {
    // color: "#fff",
    fontWeight: "bold",
    letterSpacing: 1,
    fontSize: 11,
    textTransform: "uppercase"
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    gap: 12
  },
  separator: {
    height: 2,
    backgroundColor: "#0d4ed8",
    marginVertical: 8
  },
  infoBox: {
    width: "48%",
    // borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    padding: 8
  },
  infoHeader: {
    // borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    marginBottom: 4,
    paddingBottom: 2,
    fontWeight: 700,
    fontSize: 9
  },
  infoText: {
    fontSize: 9,
    marginBottom: 2
  },
  invoiceDetails: {
    flex: 1,
    justifyContent: "space-between"
  },
  infoDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
    alignItems: "center"
  },
  infoDetailLabel: {
    fontSize: 9,
    fontWeight: "bold"
  },
  infoDetailValue: {
    fontSize: 9
  },
  table: {
    marginTop: 20,
    borderRadius: 4,
    overflow: "hidden"
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0d4ed8",
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center"
  },
  headerCell: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 9
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    backgroundColor: "#fff",
    alignItems: "center"
  },
  tableRowFooter: {
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    flexDirection: "row",
    fontSize: 8
  },
  colIndex: {
    width: "10%",
    textAlign: "center",
    fontSize: 9
  },
  colItem: {
    width: "45%",
    fontSize: 9,
    fontWeight: 600,
    paddingRight: 6
  },
  colAmount: {
    width: "15%",
    fontSize: 9,
    textAlign: "right"
  },
  colPaid: {
    width: "15%",
    fontSize: 9,
    textAlign: "right"
  },
  colBalance: {
    width: "15%",
    fontSize: 9,
    textAlign: "right"
  },
  totals: {
    marginTop: 10,
    paddingHorizontal: 4
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 9
  },
  totalLabel: {
    fontWeight: "bold"
  },
  amountPaid: {
    marginTop: 14,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  amountPaidLabel: {
    fontWeight: 700,
    fontSize: 10
  },
  amountPaidValue: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: 600
  },
  amountPendingValue: {
    fontSize: 10,
    fontWeight: 700,
    color: "#dc2626",
    marginTop: 2
  },
  bankDetails: {
    marginTop: 18,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    fontSize: 9
  },
  bankLabel: {
    fontWeight: "bold",
    marginBottom: 4,
    fontSize: 9
  },
  signature: {
    marginTop: 12,
    alignItems: "flex-end",
    fontSize: 9
  },
  notes: {
    marginTop: 10,
    fontSize: 9
  },
  notesLabel: {
    fontWeight: "bold",
    marginBottom: 2,
    fontSize: 9
  },
  footer: {
    marginTop: 14,
    fontSize: 8,
    color: "#475569",
    textAlign: "left"
  },
  signatureImage: {
    width: 140,
    height: 40,
    objectFit: "contain",
    marginTop: 6
  },
  qrImage: {
    height: 100,
    width: 100,
    objectFit: "contain"
  }
});

const defaultSubscriptionData = {
  amount: 2500,
  description: "Rented Branded App",
  startDate: "2025-11-29",
  endDate: "2025-11-29",
  invoice: "WZ180",
  paymentMode: "UPI",
  discount: 500,
  notes: "Renewal"
};

const defaultClientData = {
  name: "Mahipat",
  phone: "918955796195"
};

const defaultInvoiceMeta = {
  title: "MOHI LIFESTILE SOLUTIONS PRIVATE LIMITED",
  address: "A279, FIRST FLOOR, A-Block, NEW AMRITSAR, Amritsar Amritsar, PUNJAB, 143001",
  gstin: "03AARCM3868J1ZY",
  placeOfSupply: "Punjab",
  signature: "",
  bankName: "ICICI Bank",
  accountNumber: "777705131810",
  ifscCode: "ICIC0007335",
  branch: "New Amritsar"
};

const formatCurrency = (
  value,
  { decimals = 2, withSymbol = true, symbol = "₹", groupThousands = true } = {}
) => {
  if (!Number.isFinite(value)) return "";
  const fixed = value.toFixed(decimals);
  const [intPart, decPart = ""] = fixed.split(".");
  const withComma = groupThousands
    ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    : intPart;
  const decimalSection = decimals > 0 ? `.${decPart}` : "";
  return `${withSymbol ? symbol : ""}${withComma}${decimalSection}`;
};

const formatDateShort = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const numberToWords = (num) => {
  if (!Number.isFinite(num)) return "";
  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen"
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const toWords = (n) => {
    if (n < 20) return units[n];
    if (n < 100) {
      const unitPart = n % 10;
      return `${tens[Math.floor(n / 10)]}${unitPart ? " " + units[unitPart] : ""}`;
    }
    if (n < 1000) {
      const hundred = Math.floor(n / 100);
      const remainder = n % 100;
      return `${units[hundred]} Hundred${remainder ? " " + toWords(remainder) : ""}`;
    }
    if (n < 100000) {
      const thousand = Math.floor(n / 1000);
      const remainder = n % 1000;
      return `${toWords(thousand)} Thousand${remainder ? ", " + toWords(remainder) : ""}`;
    }
    return n.toString();
  };

  return `INR ${toWords(Math.floor(num))} Rupees Only.`;
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

function calculateTotals(totalAmount, gst) {
  const totalGSTAmount = totalAmount / (1 + (gst / 100))
  const CGSTAmount = Math.floor(totalGSTAmount / 2)
  const SGSTAmount = Math.floor(totalGSTAmount / 2)
  return {
    totalGSTAmount,
    CGSTAmount,
    SGSTAmount
  }
}

export default function MembershipInvoicePDF({
  brand: { brandLogo } = {},
  data = {}
}) {
  console.log(data)
  const subscriptionSource = data?.subscription ?? data ?? {};
  const clientSource = data?.client ?? {};
  const invoiceMetaData = data?.invoiceMeta ?? {};

  const subscription = { ...defaultSubscriptionData, ...subscriptionSource };
  const client = { ...defaultClientData, ...clientSource };
  const invoiceMeta = { ...defaultInvoiceMeta, ...invoiceMetaData };

  const {
    amount = 1000,
    description = "Membership Subscription",
    startDate,
    endDate,
    paymentMode = "cash",
    discount: subscriptionDiscount = 0,
    notes: subscriptionNotes = "Renewal",
    paidAmount: subscriptionPaidAmount = amount
  } = subscription;

  const {
    totalGSTAmount: totalAmount,
    CGSTAmount: cgst,
    SGSTAmount: sgst
  } = calculateTotals(parseInt(amount), parseInt(invoiceMeta.gst || 0))
  const discountValue = Number(subscriptionDiscount) || 0;
  const paidAmount = Number(subscriptionPaidAmount);
  const safePaidAmount = Number.isFinite(paidAmount) ? paidAmount : totalAmount;
  const pendingAmount = Math.max(totalAmount - safePaidAmount, 0);
  const taxableAmount = totalAmount / 1.18;

  const billToName = client?.name || subscription?.name || "Client";
  const billToPhone = client?.phone || client?.mobile || subscription?.phone || "";
  const paymentModeLabel = typeof paymentMode === "string" ? paymentMode.toUpperCase() : "";
  const invoiceDate = formatDate(startDate);
  const dueDate = formatDate(endDate || startDate);
  const invoiceDateShort = formatDateShort(startDate);
  const amountPaidText = `${formatCurrency(safePaidAmount, { decimals: 0, groupThousands: false })} Paid via ${paymentModeLabel}${invoiceDateShort ? ` on ${invoiceDateShort}` : ""}`;
  const pendingText = pendingAmount > 0 ? `Balance due: ${formatCurrency(pendingAmount, { decimals: 0, groupThousands: false })}` : "No balance pending";
  const notesText = subscriptionNotes || "Renewal";
  const companyName = invoiceMeta.title;
  const companyAddress = invoiceMeta.address;
  const companyGSTIN = invoiceMeta.gstin;
  const placeOfSupplyLabel = invoiceMeta.placeOfSupply;
  const signatureImageUrl = invoiceMeta.signatureBase64 || invoiceMeta.signature;
  const bankName = invoiceMeta.bankName;
  const accountNumber = invoiceMeta.accountNumber;
  const ifscCode = invoiceMeta.ifscCode;
  const branch = invoiceMeta.bankBranch;
  const qrBase64 = invoiceMeta.qrBase64;

  return (
    <PDFViewer style={{ width: "100%", height: "100vh" }}>
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.headerRow}>
            <Image style={styles.logo} src={brandLogo || "/logo_vector.png"} />
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{companyName}</Text>
              {companyAddress && <Text style={styles.companyAddress}>{companyAddress}</Text>}
              {companyGSTIN && <Text style={styles.companyAddress}>GSTIN {companyGSTIN}</Text>}
              <Text style={styles.companyAddress}>Mobile +91 7888624347 Email simarpreet@wellnessz.in</Text>
            </View>
          </View>

          <View style={styles.taxInvoiceBanner}>
            <Text style={styles.taxInvoiceLabel}>Tax Invoice</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Text style={styles.infoHeader}>Bill To</Text>
              <Text style={styles.infoText}>{billToName}</Text>
              {billToPhone && <Text style={styles.infoText}>Ph: {billToPhone}</Text>}
            </View>
            <View style={[styles.infoBox, styles.invoiceDetails]}>
              <Text style={styles.infoHeader}>Invoice Details</Text>
              <View style={styles.infoDetailRow}>
                <Text style={styles.infoDetailLabel}>Invoice Date:</Text>
                <Text style={styles.infoDetailValue}>{invoiceDate}</Text>
              </View>
              <View style={styles.infoDetailRow}>
                <Text style={styles.infoDetailLabel}>Period:</Text>
                <Text style={styles.infoDetailValue}>{invoiceDate} - {dueDate}</Text>
              </View>
              {placeOfSupplyLabel && (
                <View style={styles.infoDetailRow}>
                  <Text style={styles.infoDetailLabel}>Place of Supply:</Text>
                  <Text style={styles.infoDetailValue}>{placeOfSupplyLabel}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.colIndex]}>#</Text>
              <Text style={[styles.headerCell, styles.colItem]}>Item</Text>
              <Text style={[styles.headerCell, styles.colAmount]}>Amount</Text>
              <Text style={[styles.headerCell, styles.colPaid]}>Paid</Text>
              <Text style={[styles.headerCell, styles.colBalance]}>Balance</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.colIndex}>1</Text>
              <Text style={styles.colItem}>{description}</Text>
              <Text style={styles.colAmount}>{formatCurrency(taxableAmount, { withSymbol: false })}</Text>
              <Text style={styles.colPaid}>{formatCurrency(safePaidAmount, { withSymbol: false })}</Text>
              <Text style={styles.colBalance}>{formatCurrency(pendingAmount, { withSymbol: false })}</Text>
            </View>
            <View style={[styles.tableRowFooter, { paddingVertical: 4, paddingHorizontal: 12, justifyContent: "space-between", alignItems: "center" }]}>
              <Text>Total Items / Qty : 1 / 1</Text>
              <Text style={{ textAlign: "right" }}>Total amount (in words): {numberToWords(totalAmount)}</Text>
            </View>
          </View>

          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Taxable Amount</Text>
              <Text>{formatCurrency(taxableAmount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>CGST 9.0%</Text>
              <Text>{formatCurrency(cgst)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>SGST 9.0%</Text>
              <Text>{formatCurrency(sgst)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text>{formatCurrency(totalAmount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Paid</Text>
              <Text>{formatCurrency(safePaidAmount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Balance</Text>
              <Text>{formatCurrency(pendingAmount)}</Text>
            </View>
            {discountValue > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Discount</Text>
                <Text>{formatCurrency(discountValue)}</Text>
              </View>
            )}
          </View>

          <View style={styles.amountPaid}>
            <Text style={styles.amountPaidLabel}>Amount Paid</Text>
            <View>
              <Text style={styles.amountPaidValue}>✓ {amountPaidText}</Text>
              <Text style={styles.amountPendingValue}>{pendingText}</Text>
            </View>
          </View>

          <View style={styles.bankDetails}>
            <Text style={styles.bankLabel}>Bank Details:</Text>
            <Text>Bank: {bankName || "-"}</Text>
            <Text>Account #: {accountNumber || "-"}</Text>
            <Text>IFSC Code: {ifscCode || "-"}</Text>
            <Text>Branch: {branch || "-"}</Text>
            {qrBase64 && (
              <Image style={styles.qrImage} src={qrBase64} />
            )}
          </View>

          <View style={styles.signature}>
            {signatureImageUrl && (
              <Image style={styles.signatureImage} src={signatureImageUrl} />
            )}
            <Text>For {companyName}</Text>
            <Text>Authorized Signatory</Text>
          </View>

          {/* <View style={styles.notes}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text>{notesText}</Text>
          </View> */}

          {/* <View style={styles.footer}>
            <Text>Page 1 / 1 • This is a digitally signed document.</Text>
          </View> */}
        </Page>
      </Document>
    </PDFViewer>
  );
}


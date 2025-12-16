import { useAppSelector } from "@/providers/global/hooks";
import {
    Document,
    Image,
    Page,
    PDFViewer,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";

function getStyles(brand) {
  return StyleSheet.create({
    page: {
      padding: 30,
      fontSize: 11,
      fontFamily: "Helvetica",
      lineHeight: 1.5,
    },
    logo: {
      width: 60,
      height: 60,
      marginHorizontal: "auto",
      marginBottom: 5,
    },
    headerText: {
      textAlign: "center",
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 20,
      paddingBottom: 8,
      borderBottom: "2pt solid #000",
    },
    reportInfo: {
      marginBottom: 20,
      padding: 12,
      backgroundColor: "#f5f5f5",
      borderRadius: 5,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginVertical: 4,
      paddingVertical: 2,
    },
    label: {
      fontWeight: "bold",
      fontSize: 11,
    },
    statsSection: {
      marginTop: 15,
      marginBottom: 15,
    },
    statsTitle: {
      fontSize: 14,
      fontWeight: "bold",
      marginBottom: 10,
      paddingBottom: 5,
      borderBottom: "1pt solid #ccc",
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    statCard: {
      width: "48%",
      padding: 12,
      border: "1pt solid #ccc",
      borderRadius: 5,
      marginBottom: 12,
      backgroundColor: "#fafafa",
    },
    statLabel: {
      fontSize: 10,
      color: "#666",
      marginBottom: 6,
      fontWeight: "medium",
    },
    statValue: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#000",
      fontFamily: "Helvetica",
    },
    table: {
      marginTop: 15,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#f0f0f0",
      padding: 10,
      borderBottom: "1pt solid #ccc",
      fontWeight: "bold",
      fontSize: 10,
    },
    tableRow: {
      flexDirection: "row",
      padding: 8,
      borderBottom: "0.5pt solid #ccc",
      fontSize: 9,
      alignItems: "center",
    },
    tableCell: {
      flex: 1,
      padding: 3,
      textAlign: "left",
      fontFamily: "Helvetica",
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 0,
      right: 0,
      textAlign: "center",
      fontSize: 8,
      color: "#666",
    },
    summaryBox: {
      marginTop: 20,
      padding: 15,
      border: "1.5pt solid #000",
      borderRadius: 5,
      backgroundColor: "#fafafa",
    },
    summaryTitle: {
      fontSize: 14,
      fontWeight: "bold",
      marginBottom: 10,
      textTransform: "uppercase",
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginVertical: 4,
      paddingVertical: 3,
      borderBottom: "0.5pt solid #eee",
      fontSize: 11,
    },
  });
}

export default function PDFSalesReport({ data, brand }) {
  const coach = useAppSelector(state => state.coach.data) ?? {};
  const styles = getStyles(brand);
  
  const {
    period = "all",
    reportType = "summary",
    stats = {},
    orders = [],
    generatedDate = new Date().toLocaleDateString(),
  } = data || {};

  const periodLabel = period === "all" ? "All Time" : period.charAt(0).toUpperCase() + period.slice(1);

  return (
    <PDFViewer className="w-full h-full">
      <Document>
        <Page size="A4" style={styles.page}>
          <Image src={brand?.brandLogo || "/logo.png"} style={styles.logo} />
          <Text style={styles.headerText}>Sales Report</Text>

          <View style={styles.reportInfo}>
            <View style={styles.infoRow}>
              <Text>
                <Text style={styles.label}>Report Type: </Text>
                {reportType === "summary" ? "Summary Report" : "Detailed Report"}
              </Text>
              <Text>
                <Text style={styles.label}>Period: </Text>
                {periodLabel}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text>
                <Text style={styles.label}>Generated Date: </Text>
                {generatedDate}
              </Text>
              <Text>
                <Text style={styles.label}>Coach: </Text>
                {coach?.name || "Wellness Coach"}
              </Text>
            </View>
          </View>

          {/* Summary Statistics */}
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Summary Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Sales</Text>
                <Text style={styles.statValue}>Rs. {Number(stats.totalSales || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Orders</Text>
                <Text style={styles.statValue}>{String(Number(stats.totalOrders || 0))}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Volume Points</Text>
                <Text style={styles.statValue}>{String(Number(stats.volumePoints || 0).toFixed(2))}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Average Order Value</Text>
                <Text style={styles.statValue}>
                  Rs. {stats.totalOrders > 0 ? (stats.totalSales / stats.totalOrders).toFixed(2) : "0.00"}
                </Text>
              </View>
            </View>
          </View>

          {/* Detailed Orders Table (only for detailed reports) */}
          {reportType === "detailed" && orders.length > 0 && (
            <View style={styles.table}>
              <Text style={styles.statsTitle}>Order Details</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 1 }]}>Date</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>Client</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>Product</Text>
                <Text style={styles.tableCell}>Amount</Text>
                <Text style={styles.tableCell}>Status</Text>
              </View>
              {orders.slice(0, 20).map((order, index) => (
                <View style={styles.tableRow} key={index}>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{order.date || "-"}</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{String(order.clientName || "-")}</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{order.product || "-"}</Text>
                  <Text style={styles.tableCell}>Rs. {Number(order.sellingPrice || 0).toFixed(2)}</Text>
                  <Text style={styles.tableCell}>{order.status || "-"}</Text>
                </View>
              ))}
              {orders.length > 20 && (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    ... and {orders.length - 20} more orders
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Summary Box */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Report Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Total Sales:</Text>
              <Text>Rs. {Number(stats.totalSales || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Total Orders:</Text>
              <Text>{String(Number(stats.totalOrders || 0))}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Volume Points:</Text>
              <Text>{String(Number(stats.volumePoints || 0).toFixed(2))}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Average Order Value:</Text>
              <Text>
                Rs. {stats.totalOrders > 0 ? (stats.totalSales / stats.totalOrders).toFixed(2) : "0.00"}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text>This is an auto-generated sales report. For any discrepancies, please contact support.</Text>
          </View>
        </Page>
      </Document>
    </PDFViewer>
  );
}

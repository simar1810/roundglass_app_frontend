import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Font
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: 'Helvetica'
  },
  header: {
    alignItems: 'center',
    marginBottom: 10
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 5
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  sectionTitle: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: 5,
    fontSize: 13,
    marginTop: 10
  },
  mealCard: {
    marginTop: 10,
    padding: 10,
    border: '1px solid #ccc',
    borderRadius: 4
  },
  mealImage: {
    width: 100,
    height: 100,
    objectFit: 'cover'
  },
  footer: {
    marginTop: 40,
    fontSize: 10,
    color: '#666'
  }
});

export default function PDFMealPlan({ data }) {
  const {
    planName,
    mealTypes,
    meals,
    coachName,
    coachDescription,
    coachImage,
    brandLogo
  } = data;

  return <Document>
    <Page style={styles.page}>
      <View style={styles.header}>
        {brandLogo && <Image src={brandLogo} style={styles.logo} />}
        <Text style={styles.planName}>{planName}</Text>
      </View>
      {meals.map((mealGroup, idx) => (
        <View key={idx}>
          <Text style={styles.sectionTitle}>{mealTypes[idx] || `Meal ${idx + 1}`}</Text>
          {mealGroup.meals.map((meal, i) => (
            <View key={i} style={styles.mealCard}>
              <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{meal.name}</Text>
              <Text>{meal.description}</Text>
              <Text>⏱️ Time: {meal.mealTime}</Text>
              {meal.image && <Image src={meal.image} style={styles.mealImage} />}
            </View>
          ))}
        </View>
      ))}
      <View style={styles.footer}>
        <Text>{coachName}</Text>
        <Text>{coachDescription}</Text>
        <Text>
          Disclaimer: This PDF is for informational purposes only and is not a substitute for medical advice.
        </Text>
      </View>
    </Page>
  </Document>

}
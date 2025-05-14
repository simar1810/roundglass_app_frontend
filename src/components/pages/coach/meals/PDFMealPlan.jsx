import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff'
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  sectionTitle: {
    backgroundColor: '#FFA500', // Orange
    color: '#ffffff',
    padding: 6,
    borderRadius: 8,
    fontSize: 12,
    textTransform: 'capitalize',
    marginTop: 20,
    marginBottom: 5
  },
  mealCard: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottom: '1px solid #ddd'
  },
  mealTextContainer: {
    flex: 1,
    paddingRight: 10
  },
  mealTitle: {
    color: '#FFA500',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2
  },
  mealDescription: {
    marginBottom: 4
  },
  mealTime: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 12,
    fontSize: 10,
    borderWidth: 1,
    borderColor: '#007f00',
    alignSelf: 'flex-start'
  },
  mealImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    objectFit: 'cover'
  },
  footer: {
    marginTop: 30,
    fontSize: 9,
    color: '#888'
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

  return (
    <Document>
      <Page style={styles.page}>
        <View style={styles.header}>
          {brandLogo && <Image src={brandLogo} style={styles.logo} />}
          <Text style={styles.planName}>{planName}</Text>
        </View>

        {meals.map((mealGroup, idx) => (
          <View key={idx}>
            <Text style={styles.sectionTitle}>
              {mealTypes[idx] || `Meal ${idx + 1}`}
            </Text>
            {mealGroup.meals.map((meal, i) => (
              <View key={i} style={styles.mealCard}>
                <View style={styles.mealTextContainer}>
                  <Text style={styles.mealTitle}>{meal.name}</Text>
                  <Text style={styles.mealDescription}>{meal.description}</Text>
                  <Text style={styles.mealTime}>Time: {meal.mealTime}</Text>
                </View>
                {meal.image && <Image src={meal.image} style={styles.mealImage} />}
              </View>
            ))}
          </View>
        ))}

        <View style={styles.footer}>
          {coachName && <Text>{coachName}</Text>}
          {coachDescription && <Text>{coachDescription}</Text>}
          <Text>
            Disclaimer: This PDF is for informational purposes only and is not a
            substitute for medical advice.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

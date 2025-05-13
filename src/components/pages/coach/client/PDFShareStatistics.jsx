import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font
} from '@react-pdf/renderer';


// Register custom font
Font.register({ family: 'NotoSans', src: "/fonts/Roboto-Regular.ttf" });

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'NotoSans',
  },
  brandName: {
    fontSize: 24,
    textAlign: 'center',
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  reportTitle: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: 'bold',
  },
  divider: {
    height: 2,
    backgroundColor: '#FFC107',
    marginVertical: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: 12,
    borderRadius: 6,
  },
  statsTitle: {
    fontSize: 18,
    marginTop: 20,
    fontWeight: 'bold',
  },
  healthBlock: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    marginTop: 10,
    borderRadius: 6,
  },
  bottomBanner: {
    marginTop: 40,
    width: '100%',
  },
});

export default function PDFShareStatistics({ data }) {
  return (
    <Document>
      <StatisticsPage1 data={data} />
      <StatisticsPage2 data={data} />
      <StatisticsPage3 data={data} />
      <StatisticsPage4 data={data} />
      <StatisticsPage5 data={data} />
      <StatisticsPage6 data={data} />
    </Document>
  );
};

function StatisticsPage1({ data }) {
  const {
    clientName,
    age,
    gender,
    joined,
    weight,
    height,
    fatPercentage,
  } = data;
  return <Page size="A4" style={styles.page}>
    {/* Brand & Report */}
    <Text style={styles.brandName}>WellnessZ</Text>
    <Text style={styles.reportTitle}>Client Wellness Report</Text>
    <View style={styles.divider} />

    {/* Client Info */}
    <View style={styles.infoContainer}>
      <View>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{clientName}</Text>
        <Text>{`${age} Yrs | ${gender}`}</Text>
      </View>
      <View>
        <Text>Generated On: {joined}</Text>
        <Text>{`Weight: ${weight} | Height: ${height}`}</Text>
      </View>
    </View>

    {/* Statistics Title */}
    <Text style={styles.statsTitle}>Statistics</Text>
    <View style={styles.divider} />
    <Text>Here is a quick summary of your body metrics.</Text>

    {/* Health Metric Block – Weight */}
    <View style={styles.healthBlock}>
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Weight</Text>
      <Text>Current: {weight} kg</Text>
      <Text>Ideal: 75 kg</Text>
      <Text>Status: Healthy</Text>
    </View>

    {/* Health Metric Block – Fat % */}
    {fatPercentage && (
      <View style={styles.healthBlock}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Fat Percentage</Text>
        <Text>Current: {fatPercentage}%</Text>
        <Text>Status: Moderate</Text>
      </View>
    )}

    {/* Bottom Banner */}
    <Image
      style={styles.bottomBanner}
      src="/assets/bottom.png"
    />
  </Page>
}

function StatisticsPage2({ data }) {
  return <Page size="A4" style={styles.page}>
    {/* Header Row */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={styles.sectionTitle}>Body Composition</Text>
      <Image
        src="/logo.png"
        style={{ width: 100, height: 40 }}
      />
    </View>
    <View style={styles.divider} />

    {/* Body Composition Description */}
    <Text style={styles.paragraph}>
      This section provides an overview of your body structure and type.
    </Text>

    {/* Body Type Strip (L1 to L9) */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 }}>
      {Array.from({ length: 9 }, (_, i) => (
        <Image
          key={i}
          src={`/assets/L${i + 1}.png`}
          style={{ width: 28, height: 60 }}
        />
      ))}
    </View>

    {/* Summary Section */}
    <Text style={styles.sectionTitle}>Summary</Text>
    <View style={styles.divider} />
    <Text style={styles.paragraph}>
      Dear {data.clientName}, based on your metrics, here is a quick summary.
    </Text>

    <View style={{ flexDirection: 'row', marginTop: 10 }}>
      {/* Body Composition Flower */}
      <View style={{ width: '30%', alignItems: 'center' }}>
        <Image
          src="/assets/flower.png"
          style={{ width: 90, height: 90 }}
        />
        <Text style={{ fontSize: 14 }}>{data.bodyComposition}</Text>
        <Text style={styles.subtext}>Body Composition</Text>
      </View>

      {/* Weight Block + Risk Info */}
      <View style={{ marginLeft: 20 }}>
        <Image
          src="/assets/redflower.png"
          style={{ width: 90, height: 90 }}
        />
        <Text style={{ marginTop: 6 }}>{data.weight} Kg</Text>
        <Text style={styles.subtext}>Body Weight</Text>

        <Image
          src="/assets/containerred.png"
          style={{ width: 300, height: 100, marginTop: 10 }}
        />
        <Text style={{ fontSize: 10, marginTop: 5, width: 280 }}>
          Overweight may lead to increased health risks including joint pain, heart problems,
          and decreased energy. Regular activity and guided nutrition is recommended.
        </Text>
      </View>
    </View>

    {/* Footer Elements */}
    <Image
      src="/assets/bottom.png"
      style={{ marginTop: 30, width: '100%' }}
    />
  </Page>
}


function StatisticsPage3({ data }) {
  return <Page size="A4" style={styles.page}>
    {/* Header */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={styles.sectionTitle}>BMI</Text>
      <Image src="/logo.png" style={{ width: 100, height: 40 }} />
    </View>
    <View style={styles.divider} />

    {/* Description */}
    <Text style={styles.paragraph}>
      Body Mass Index (BMI) helps evaluate whether your weight is in a healthy range based on height.
    </Text>

    {/* BMI Flower with Value */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 }}>
      <View style={{ alignItems: 'center' }}>
        <Image src="/assets/flower.png" style={{ width: 90, height: 90 }} />
        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{data.bmi ?? '0.0'}</Text>
        <Text style={styles.subtext}>
          {(parseFloat(data.bmi ?? 0) >= 18 && parseFloat(data.bmi ?? 0) <= 25)
            ? 'Healthy'
            : 'Not Healthy'}
        </Text>
        <Text style={styles.subtext}>BMI</Text>
      </View>
    </View>

    {/* Green Container */}
    <Image src="/assets/container2.png" style={{ width: '100%', height: 90 }} />
    <Text style={{ fontSize: 10, marginTop: 5 }}>
      In range: A BMI of 18.5–24.9 is considered healthy. Maintain through regular activity and balanced diet.
    </Text>

    {/* Red Container */}
    <Image src="/assets/containerred.png" style={{ width: '100%', height: 90, marginTop: 20 }} />
    <Text style={{ fontSize: 10, marginTop: 5 }}>
      Out of range: BMI under 18 or above 25 can increase health risks. Consult your coach for improvements.
    </Text>

    {/* Suggestion */}
    <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Suggestions</Text>
    <Text style={styles.paragraph}>
      Include strength training, track calorie intake, and eat whole foods to improve BMI.
    </Text>

    {/* Footer */}
    <Image src="/assets/container.png" style={{ marginTop: 30, width: '100%', height: 90 }} />
    <Image src="/assets/bottom.png" style={{ width: '100%', marginTop: 8 }} />
  </Page>
}

function StatisticsPage4({ data }) {
  return <Page size="A4" style={styles.page}>
    {/* Header */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={styles.sectionTitle}>Muscle Percentage</Text>
      <Image src="/logo.png" style={{ width: 100, height: 40 }} />
    </View>
    <View style={styles.divider} />

    {/* Description */}
    <Text style={styles.paragraph}>
      Muscle mass percentage reflects how much of your body is made up of muscle tissues.
      It's a critical metric for strength, posture, and metabolism.
    </Text>

    {/* Muscle % Flower Display */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 }}>
      <View style={{ alignItems: 'center' }}>
        <Image src="/assets/flower.png" style={{ width: 90, height: 90 }} />
        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{data.musclePercentage ?? '0.0'}%</Text>
        <Text style={styles.subtext}>
          {(parseFloat(data.musclePercentage ?? 0) >= 30 &&
            parseFloat(data.musclePercentage ?? 0) <= 45)
            ? 'Healthy'
            : 'Needs Work'}
        </Text>
        <Text style={styles.subtext}>Muscle %</Text>
      </View>
    </View>

    {/* Green Container */}
    <Image src="/assets/container2.png" style={{ width: '100%', height: 90 }} />
    <Text style={{ fontSize: 10, marginTop: 5 }}>
      In range: For men, 32–36% is considered healthy; women: 24–30%. Athletes may exceed 38–42%.
    </Text>

    {/* Red Container */}
    <Image src="/assets/containerred.png" style={{ width: '100%', height: 90, marginTop: 20 }} />
    <Text style={{ fontSize: 10, marginTop: 5 }}>
      Low muscle % may lead to weakness, poor balance, and slower metabolism. Resistance training is key.
    </Text>

    {/* Suggestion */}
    <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Suggestions</Text>
    <Text style={styles.paragraph}>
      Start regular strength-based workouts (pushups, dumbbells), and eat more lean protein to improve muscle percentage.
    </Text>

    {/* Footer */}
    <Image src="/assets/container.png" style={{ marginTop: 30, width: '100%', height: 90 }} />
    <Image src="/assets/bottom.png" style={{ width: '100%', marginTop: 8 }} />
  </Page>
}

function StatisticsPage5({ data }) {
  return <Page size="A4" style={styles.page}>
    {/* Header */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={styles.sectionTitle}>Resting Metabolism</Text>
      <Image src="/logo.png" style={{ width: 100, height: 40 }} />
    </View>
    <View style={styles.divider} />

    {/* Description */}
    <Text style={styles.paragraph}>
      Resting Metabolism (RM) refers to the number of calories your body burns while at rest.
      A higher RM indicates better metabolism and calorie-burning efficiency.
    </Text>

    {/* Flower + RM Value */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 }}>
      <View style={{ alignItems: 'center' }}>
        <Image src="/assets/flower.png" style={{ width: 90, height: 90 }} />
        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{data.restingMetabolism ?? '0'} kcal</Text>
        <Text style={styles.subtext}>
          {(parseFloat(data.restingMetabolism ?? 0) >= 1500 &&
            parseFloat(data.restingMetabolism ?? 0) <= 3000)
            ? 'Healthy'
            : 'Needs Work'}
        </Text>
        <Text style={styles.subtext}>Resting Metabolism</Text>
      </View>
    </View>

    {/* Green Container */}
    <Image src="/assets/container2.png" style={{ width: '100%', height: 90 }} />
    <Text style={{ fontSize: 10, marginTop: 5 }}>
      In Range: RM between 1500–3000 kcal is considered ideal for most adults. Good RM helps burn fat faster.
    </Text>

    {/* Red Container */}
    <Image src="/assets/containerred.png" style={{ width: '100%', height: 90, marginTop: 20 }} />
    <Text style={{ fontSize: 10, marginTop: 5 }}>
      Low RM may lead to slower fat burn, fatigue, and difficulty in weight loss. Can result from low muscle mass or inactivity.
    </Text>

    {/* Suggestion */}
    <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Suggestions</Text>
    <Text style={styles.paragraph}>
      Increase activity levels, drink more water, add strength training, and avoid crash dieting to boost RM.
    </Text>

    {/* Footer */}
    <Image src="/assets/container.png" style={{ marginTop: 30, width: '100%', height: 90 }} />
    <Image src="/assets/bottom.png" style={{ width: '100%', marginTop: 8 }} />
  </Page>
}

function StatisticsPage6({ data }) {
  return <Page size="A4" style={styles.page}>
    {/* Suggestions Header */}
    <Text style={styles.sectionTitle}>Suggestions</Text>
    <View style={styles.divider} />

    {/* 1. Eating Block */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
      <View style={{ width: '50%' }}>
        <Text style={[styles.subsectionTitle]}>1. Nutrition</Text>
        <Text style={styles.paragraph}>
          Eat whole foods, hydrate regularly, and include fiber and protein in every meal.
          Avoid excessive sugar and processed snacks.
        </Text>
      </View>
      <Image
        src="/assets/eating.png"
        style={{ width: 180, height: 120 }}
      />
    </View>

    {/* 2. Exercise Block */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
      <Image
        src="/assets/dumbell.png"
        style={{ width: 180, height: 120 }}
      />
      <View style={{ width: '50%' }}>
        <Text style={styles.subsectionTitle}>2. Physical Activity</Text>
        <Text style={styles.paragraph}>
          Engage in strength training, cardio, and flexibility workouts at least 4x/week.
          Movement is the key to transformation.
        </Text>
      </View>
    </View>

    {/* 3. Stress Management Block */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
      <View style={{ width: '50%' }}>
        <Text style={styles.subsectionTitle}>3. Stress & Sleep</Text>
        <Text style={styles.paragraph}>
          Prioritize good sleep (7–8 hrs/day), practice meditation, and avoid late-night screen time.
          Mental peace supports physical results.
        </Text>
      </View>
      <Image
        src="/assets/stress.png"
        style={{ width: 180, height: 120 }}
      />
    </View>

    {/* Coach Info */}
    <View style={{ marginTop: 32 }}>
      <Text style={[styles.sectionTitle, { fontSize: 16 }]}>Your Wellness Coach</Text>
      <View style={styles.divider} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        <View style={{ width: '50%' }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#4CAF50' }}>
            {data.coachName ?? 'Your Coach'}
          </Text>
          <Text style={styles.paragraph}>{data.coachDescription ?? 'Dedicated to your transformation journey.'}</Text>
        </View>
        <Image
          src={data.coachProfileImage || "/assets/tryimage.png"}
          style={{ width: 120, height: 120, borderRadius: 60 }}
        />
      </View>
    </View>

    {/* Footer */}
    <Image src="/assets/container.png" style={{ marginTop: 40, width: '100%', height: 90 }} />
    <Image src="/assets/bottom.png" style={{ width: '100%', marginTop: 8 }} />
  </Page>
}
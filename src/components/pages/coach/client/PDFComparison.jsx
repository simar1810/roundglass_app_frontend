"use client";
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import React from 'react';

// ✅ Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    paddingLeft: 50,
    paddingRight: 30,
  },
  leftSection: {
    width: '85%',
    paddingTop: 50,
    paddingRight: 30,
  },
  rightStrip: {
    width: '15%',
    height: '100%',
  },
  logo: {
    height: 50,
    alignSelf: 'center',
    marginBottom: 10,
  },
  heading: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  greenBox: {
    backgroundColor: '#98D89E',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 10,
  },
  whiteText: {
    color: '#fff',
    fontSize: 14,
  },
  table: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#aaa',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#aaa',
  },
  cell: {
    flex: 1,
    padding: 5,
    fontSize: 10,
  },
  footerStrip: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 8,
    color: '#98D89E',
  }
});

// ✅ Component
export default function PDFComparison({ data }) {
  return (
    <Document>
      <Comparison1 data={data} />
      <Comparison2 data={data} />
      <Comparison3 data={data} />
      <Comparison4 data={data} />
      <Comparison5 data={data} />
    </Document>
  );
};

function Comparison1({ data }) {
  const {
    clientName = '',
    age = '',
    gender = '',
    joined = '',
    weight = '',
    height = '',
    brandLogo,
    allStatsList = [],
    sideImage,
    bottomStripImage,
  } = data;

  return <Page size="A4" style={styles.page}>
    {/* Left Content */}
    <View style={styles.leftSection}>
      <Image src={"/logo.png"} style={styles.logo} />
      <Text style={styles.heading}>Health Summary</Text>

      <View style={styles.greenBox}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={styles.whiteText}>{clientName}</Text>
            <Text style={styles.whiteText}>{`${age} Yrs | ${gender}`}</Text>
          </View>
          <View>
            <Text style={styles.whiteText}>{`Generated on: ${joined}`}</Text>
            <Text style={styles.whiteText}>{`Weight: ${weight} | Height: ${height}`}</Text>
          </View>
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={[styles.row, { backgroundColor: '#98D89E' }]}>
          <Text style={[styles.cell, { color: '#fff' }]}>Date</Text>
          <Text style={[styles.cell, { color: '#fff' }]}>Weight</Text>
          <Text style={[styles.cell, { color: '#fff' }]}>BMI</Text>
          <Text style={[styles.cell, { color: '#fff' }]}>Muscle%</Text>
          <Text style={[styles.cell, { color: '#fff' }]}>Fat%</Text>
          <Text style={[styles.cell, { color: '#fff' }]}>RM</Text>
        </View>
        {allStatsList.slice(0, 15).map((stat, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.cell}>{stat.createdDate}</Text>
            <Text style={styles.cell}>{stat.weight}</Text>
            <Text style={styles.cell}>{stat.bmi}</Text>
            <Text style={styles.cell}>{stat.muscle}</Text>
            <Text style={styles.cell}>{stat.fat}</Text>
            <Text style={styles.cell}>{stat.rm}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.footerStrip}>
        Disclaimer: This report is for informational purposes only.
      </Text>

      <Image src={bottomStripImage} style={{ width: 500, height: 90, marginTop: 10 }} />
    </View>

    {/* Right Border Strip */}
    <Image src={sideImage} style={styles.rightStrip} />
  </Page>
}

function Comparison2({ data }) {
  const {
    brandLogo,
    allStatsList = [],
    sideImage,
    bottomStripImage,
  } = data;

  const secondPageStats = allStatsList.slice(15, 30);

  if (secondPageStats.length === 0) return null;

  return <Page size="A4" style={styles.page}>
    <View style={styles.leftSection}>
      <Image src={"/logo.png"} style={styles.logo} />
      <Text style={styles.heading}>Health Summary (Continued)</Text>

      <View style={styles.table}>
        <View style={[styles.row, { backgroundColor: '#98D89E' }]}>
          <Text style={[styles.cell, { color: '#fff' }]}>Date</Text>
          <Text style={[styles.cell, { color: '#fff' }]}>Weight</Text>
          <Text style={[styles.cell, { color: '#fff' }]}>BMI</Text>
          <Text style={[styles.cell, { color: '#fff' }]}>Muscle%</Text>
          <Text style={[styles.cell, { color: '#fff' }]}>Fat%</Text>
          <Text style={[styles.cell, { color: '#fff' }]}>RM</Text>
        </View>
        {secondPageStats.map((stat, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.cell}>{stat.createdDate}</Text>
            <Text style={styles.cell}>{stat.weight}</Text>
            <Text style={styles.cell}>{stat.bmi}</Text>
            <Text style={styles.cell}>{stat.muscle}</Text>
            <Text style={styles.cell}>{stat.fat}</Text>
            <Text style={styles.cell}>{stat.rm}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.footerStrip}>
        Disclaimer: This report is for informational purposes only.
      </Text>

      <Image src={bottomStripImage} style={{ width: 500, height: 90, marginTop: 10 }} />
    </View>

    <Image src={sideImage} style={styles.rightStrip} />
  </Page>
}

function Comparison3({ data }) {
  const {
    bmi = '',
    flowerImage,
    greenStripImage,
    greenContainerImage,
    redContainerImage,
    bottomStripImage,
    sideImage,
    weight
  } = data;

  return <Page size="A4" style={styles.page}>
    <View style={styles.leftSection}>
      <Text style={styles.heading}>Body Weight</Text>
      <View style={styles.divider} />

      <View style={styles.flowerStack}>
        <Image src={flowerImage} style={{ height: 150 }} />
        <Text style={{ color: 'white', fontSize: 16, position: 'absolute', top: 60 }}>{weight} Kg</Text>
      </View>

      <Text style={styles.suggestionStrip}>
        Optimal Weight Range varies by height & gender
      </Text>

      <Text style={styles.boldText}>Your Average Weight was {weight} Kg.</Text>

      <Text style={styles.paragraph}>
        Weight is one of the most critical health indicators. Whether underweight or overweight,
        it directly impacts your metabolism, organ function, and energy levels.
      </Text>

      <Text style={{ ...styles.heading, fontSize: 15, color: '#5CB85C', marginTop: 10 }}>Why Weight Matters</Text>
      <Text style={styles.paragraph}>
        Managing your weight helps reduce the risk of chronic illnesses like diabetes, heart disease, and fatigue.
        Balanced nutrition and regular movement are essential for healthy body weight.
      </Text>

      <View style={styles.containerBox}>
        <Image src={redContainerImage} style={{ width: 500, height: 145 }} />
        <View style={styles.containerOverlay}>
          <Text style={styles.boxTitle}>Risk Zone</Text>
          <Text style={styles.boxContent}>
            Being overweight or underweight can lead to fatigue, organ stress, reduced performance, and long-term diseases.
            Seek guidance for a balanced routine.
          </Text>
        </View>
      </View>

      <Text style={styles.footerStrip}>
        Disclaimer: This is an informational report, not a medical diagnosis.
      </Text>

      <Image src={bottomStripImage} style={{ width: 500, height: 90, marginTop: 10 }} />
    </View>

    <Image src={sideImage} style={styles.rightStrip} />
  </Page>
}

function Comparison4({ data }) {
  const {
    bmi,
    musclePercentage = '',
    flowerImage,
    greenContainerImage,
    redContainerImage,
    greenStripImage,
    bottomStripImage,
    sideImage,
  } = data;

  return <Page size="A4" style={styles.page}>
    <View style={styles.leftSection}>
      <Text style={styles.heading}>BMI (Body Mass Index)</Text>
      <View style={styles.divider} />

      <View style={styles.flowerStack}>
        <Image src={flowerImage} style={{ height: 150 }} />
        <Text style={{ color: 'white', fontSize: 16, position: 'absolute', top: 60 }}>{bmi}</Text>
      </View>

      <Text style={styles.suggestionStrip}>
        BMI between 18.5 to 24.9 is considered optimal
      </Text>

      <Text style={styles.boldText}>Your Average BMI was {bmi}</Text>

      <Text style={styles.paragraph}>
        BMI (Body Mass Index) is a widely used indicator to assess a person’s weight status relative to height.
        It helps categorize underweight, normal weight, overweight, and obesity.
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <View style={styles.containerBox}>
          <Image src={greenContainerImage} style={{ width: 240, height: 200 }} />
          <View style={styles.containerOverlay}>
            <Text style={styles.boxTitleGreen}>If within Normal Range</Text>
            <Text style={styles.boxContent}>
              A healthy BMI supports better energy levels, reduced disease risk, and a balanced metabolic state.
            </Text>
          </View>
        </View>

        <View style={styles.containerBox}>
          <Image src={redContainerImage} style={{ width: 240, height: 200 }} />
          <View style={styles.containerOverlay}>
            <Text style={styles.boxTitleRed}>If Outside Normal Range</Text>
            <Text style={styles.boxContent}>
              A high or low BMI may lead to health risks such as cardiovascular issues or undernutrition.
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.heading}>Suggestions</Text>
      <View style={styles.divider} />
      <Text style={styles.paragraph}>
        Maintain a balanced diet and regular physical activity. Track your BMI monthly and consult a professional for personalized guidance.
      </Text>

      <Text style={styles.footerStrip}>
        Disclaimer: This is an informational report, not a clinical diagnosis.
      </Text>

      <Image src={bottomStripImage} style={{ width: 500, height: 90, marginTop: 10 }} />
    </View>

    <Image src={sideImage} style={styles.rightStrip} />
  </Page>
}

function Comparison5({ data }) {
  const {
    musclePercentage = '',
    flowerImage,
    greenContainerImage,
    redContainerImage,
    greenStripImage,
    bottomStripImage,
    sideImage,
  } = data;

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.leftSection}>
        <Text style={styles.heading}>Muscle Percentage</Text>
        <View style={styles.divider} />

        <View style={styles.flowerStack}>
          <Image src={flowerImage} style={{ height: 150 }} />
          <Text style={{ color: 'white', fontSize: 16, position: 'absolute', top: 60 }}>
            {musclePercentage}
          </Text>
        </View>

        <Text style={styles.suggestionStrip}>Optimal range for men: 32–36%, women: 24–30%</Text>

        <Text style={styles.boldText}>
          Your Average Muscle Percentage was {musclePercentage}%
        </Text>

        <Text style={styles.paragraph}>
          Muscle percentage refers to the portion of body mass composed of muscle tissue.
          Higher muscle mass improves strength, metabolism, and fitness performance.
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={styles.containerBox}>
            <Image src={greenContainerImage} style={{ width: 240, height: 200 }} />
            <View style={styles.containerOverlay}>
              <Text style={styles.boxTitleGreen}>If within Normal Range</Text>
              <Text style={styles.boxContent}>
                Adequate muscle mass boosts metabolism, supports daily movements, and reduces injury risks.
              </Text>
            </View>
          </View>

          <View style={styles.containerBox}>
            <Image src={redContainerImage} style={{ width: 240, height: 200 }} />
            <View style={styles.containerOverlay}>
              <Text style={styles.boxTitleRed}>If Outside Normal Range</Text>
              <Text style={styles.boxContent}>
                Low muscle % may indicate poor nutrition or inactivity; high % is generally good unless paired with excess fat.
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.heading}>Suggestions</Text>
        <View style={styles.divider} />
        <Text style={styles.paragraph}>
          Include resistance training, adequate protein, and hydration to build and maintain muscle mass.
        </Text>

        <Text style={styles.footerStrip}>
          Disclaimer: This report is for informational purposes only and not a clinical diagnosis.
        </Text>

        <Image src={bottomStripImage} style={{ width: 500, height: 90, marginTop: 10 }} />
      </View>

      <Image src={sideImage} style={styles.rightStrip} />
    </Page>
  )
}
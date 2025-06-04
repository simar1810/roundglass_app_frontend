"use client";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  PDFViewer,
} from "@react-pdf/renderer";

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    justifyContent: "center", // Center children horizontally
    alignItems: "flex-start", // Align to top (you can change to 'center' if you want vertical center)
    paddingLeft: 50,
    paddingRight: 10,
  },
  leftSection: {
    width: "85%",
    paddingTop: 50,
    paddingRight: 30,
  },
  rightStrip: {
    width: "15%",
    height: "100%",
  },
  logo: {
    height: 50,
    alignSelf: "center",
    marginBottom: 10,
  },
  heading: {
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 10,
  },
  greenBox: {
    backgroundColor: "#FFA500",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 10,
  },
  whiteText: {
    color: "#fff",
    fontSize: 14,
  },
  table: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#aaa",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#aaa",
  },
  cell: {
    flex: 1,
    padding: 5,
    fontSize: 10,
  },
  footerStrip: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 8,
    color: "#98D89E",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#98D89E",
    marginVertical: 10,
  },
  flowerStack: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  suggestionStrip: {
    backgroundColor: "#98D89E",
    color: "white",
    padding: 8,
    fontSize: 12,
    textAlign: "center",
    marginVertical: 15,
    borderRadius: 5,
  },
  boldText: {
    fontWeight: "bold",
    fontSize: 14,
    marginVertical: 10,
  },
  paragraph: {
    fontSize: 12,
    lineHeight: 1.5,
    marginVertical: 10,
  },
  containerBox: {
    position: "relative",
    marginVertical: 10,
  },
  containerOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  boxTitleGreen: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#5CB85C",
  },
  boxTitleRed: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#D9534F",
  },
  boxContent: {
    fontSize: 11,
    lineHeight: 1.5,
  },
  bottomBanner: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    padding: 12,
    backgroundColor: "#fff", // Optional: set background to avoid overlap issues
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
  },
  bodyWeightCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginVertical: 10,
  },
  bodyWeightText: {
    color: "#ffffff",
    fontSize: 12,
    textAlign: "center",
  },
  optimalWeightBox: {
    backgroundColor: "#4CAF50",
    borderColor: "#ffc107",
    borderWidth: 1,
    padding: 4,
    fontSize: 9,
    marginVertical: 5,
    textAlign: "center",
  },
  boldHighlight: {
    fontWeight: "bold",
    fontSize: 11,
  },
  whyHeader: {
    color: "#ff9800",
    fontWeight: "bold",
    fontSize: 12,
    marginTop: 10,
    marginBottom: 5,
  },
  riskHeader: {
    color: "#d32f2f",
    fontWeight: "bold",
    fontSize: 17,
    marginTop: 25,
    marginBottom: 5,
  },
  riskBox: {
    backgroundColor: "#ffe6e6",
    padding: 8,
    fontSize: 10,
    borderRadius: 5,
    color: "#d32f2f",
    flex: 1,
  },
  disclaimer: {
    marginTop: 20,
    fontSize: 8,
    padding: 6,
    backgroundColor: "#d4edda",
    borderColor: "#c3e6cb",
    color: "#444",
    borderRadius: 5,
  },
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16, // For spacing between columns (optional)
  },
  normalBox: {
    flex: 1,
    backgroundColor: "#d4edda", // Light green
    padding: 10,
    borderRadius: 10,
  },

  riskHeader: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#721c24",
  },
  whyText: {
    fontSize: 8,
    color: "#155724",
  },
  container: {
    padding: 16,
  },
  topSection: {
    flexDirection: "row",
    gap: 16,
  },
  highlightBox: {
    flex: 1,
    backgroundColor: "#a020f0", // Vibrant purple
    borderRadius: 12,
    padding: 16,
  },
  highlightTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  weightLossBox: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  weightText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#a020f0",
  },
  weightSubText: {
    fontSize: 12,
    color: "#a020f0",
  },
  highlightContent: {
    fontSize: 14,
    color: "#fff",
  },
  healthTipsBox: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    borderBottomWidth: 2,
    borderBottomColor: "#50b3a2",
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "flex-start",
  },
  tipEmoji: {
    width: 16,
    height: 16,
    marginRight: 8,
    marginTop: 2,
    resizeMode: "contain",
  },
  tipText: {
    flex: 1,
    fontSize: 14,
  },
  tipTitle: {
    fontWeight: "bold",
  },
  coachSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#f0ad4e",
    paddingTop: 16,
  },
  coachLabel: {
    fontSize: 16,
    color: "#555",
  },
  coachName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f0ad4e",
    marginBottom: 4,
  },
  goalText: {
    fontSize: 14,
  },
});

// Component
export default function PDFComparison({ data }) {
  return (
    <PDFViewer className="w-full h-full ">
      <Document>
        <Comparison1 data={data} />
        {/* <Comparison2 data={data} /> */}
        <Comparison3 data={data} />
        <Comparison4 data={data} />
        <Comparison5 data={data} />
        <Comparison6 data={data} />
        <Comparison7 data={data} />
      </Document>
    </PDFViewer>
  );
}

function Comparison1({ data }) {
  const {
    clientName = "",
    age = "",
    gender = "",
    joined = "",
    weight = "",
    height = "",
    brandLogo,
    bmi,
    allStatsList = [],
    sideImage,
    bottomStripImage,
  } = data;

  return (
    <Page size="A4" style={styles.page}>
      {/* Left Content */}
      <View style={styles.leftSection}>
        <Image src={"/logo.png"} style={styles.logo} />
        <Text style={styles.heading}>Health Status Report</Text>
        <View style={styles.divider} />

        <View style={styles.greenBox}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View>
              <Text style={styles.whiteText}>{clientName}</Text>
              <Text style={styles.whiteText}>{`${age} Yrs | ${gender}`}</Text>
            </View>
            <View>
              <Text style={styles.whiteText}>{`Generated on: ${joined}`}</Text>
              <Text
                style={styles.whiteText}
              >{`Weight: ${weight} | Height: ${height}`}</Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={[styles.row, { backgroundColor: "#FFA500" }]}>
            <Text style={[styles.cell, { color: "#fff" }]}>Date</Text>
            <Text style={[styles.cell, { color: "#fff" }]}>Weight</Text>
            <Text style={[styles.cell, { color: "#fff" }]}>BMI</Text>
            <Text style={[styles.cell, { color: "#fff" }]}>Muscle%</Text>
            <Text style={[styles.cell, { color: "#fff" }]}>Fat%</Text>
            <Text style={[styles.cell, { color: "#fff" }]}>RM</Text>
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
        <Image
          src="/assets/containergreen.png"
          style={{ width: 300, height: 100, marginTop: 10 }}
        />
        <Image src="../assets/bottom.png" style={styles.bottomBanner} />
      </View>

      {/* Right Border Strip */}
      <Image src={sideImage || "/placeholder.svg"} style={styles.rightStrip} />
    </Page>
  );
}

function Comparison2({ data }) {
  const { weight, optimalWeight, weightMessage, description, riskDescription } =
    data;

  return (
    <Document>
      <Page
        size="A4"
        style={{
          padding: 30,
          fontSize: 11,
          fontFamily: "Helvetica",
          lineHeight: 1.5,
          backgroundColor: "#ffffff",
        }}
      >
        <Text style={styles.sectionTitle}>Body Weight</Text>

        <View style={styles.bodyWeightCircle}>
          <Text style={styles.bodyWeightText}>{weight} KG</Text>
          <Text style={styles.bodyWeightText}>Body Weight</Text>
        </View>

        <Text style={styles.optimalWeightBox}>
          Optimal Weight as per your Age and Body Composition is {optimalWeight}
        </Text>

        <Text>
          Your Average Body Weight was{" "}
          <Text style={styles.boldHighlight}>{weight} KG</Text>.
        </Text>
        <Text>
          Your Statistic Report is here, Analyse and track your progressstics
        </Text>

        <Text style={styles.whyHeader}>Why Maintain Body Weight?</Text>
        <Text>
          Maintaining a healthy body weight requires a balance of mindful
          eating, regular exercise, and a positive lifestyle. Start by
          incorporating a variety of nutrient-rich foods into your diet,
          focusing on whole grains, lean proteins, and plenty of fruits and
          vegetables. Portion control is essential—listen to your body's hunger
          and fullness cues to avoid overeating. Stay active with a mix of
          cardio, strength training, and flexibility exercises, aiming for at
          least 30 minutes a day. Hydration is key, so drink plenty of water
          throughout the day to support your metabolism and prevent unnecessary
          snacking. Lastly, prioritize sleep and stress management, as both play
          a significant role in maintaining a healthy weight. Consistency is the
          secret—small, sustainable changes over time will lead to lasting
          results
        </Text>

        <Text style={styles.riskHeader}>Risks due to Overweight</Text>
        <View
          style={{
            backgroundColor: "#ffe6e6",
            padding: 8,
            fontSize: 10,
            borderRadius: 5,
            color: "#d32f2f",
          }}
        >
          <Text>
            {" "}
            Being overweight can lead to serious health risks, including
            cardiovascular diseases like heart disease and hypertension, type 2
            diabetes, and joint problems such as osteoarthritis. Respiratory
            issues, like sleep apnea, and mental health challenges, including
            depression and anxiety, are also common. Additionally, the risk of
            certain cancers, such as breast, colon, and kidney cancer, is
            higher. Maintaining a healthy weight through balanced nutrition and
            regular exercise is crucial for reducing these risks and enhancing
            overall well-being
          </Text>
        </View>

        <Text style={styles.disclaimer}>
          Disclaimer: This report does not provide any medical advice & is not a
          clinical report. It is intended for informational purposes only. It is
          not a substitute for professional medical advice, diagnosis or
          treatment. This report is generated based on the information provided
          by you. Please talk to your doctor / health professional for any
          further treatment.
        </Text>
      </Page>
    </Document>
  );
}

function Comparison3({ data }) {
  const {
    bmi = "",
    flowerImage,
    greenStripImage,
    greenContainerImage,
    redContainerImage,
    bottomStripImage,
    sideImage,
    weight,
  } = data;

  return (
    <Document>
      <Page
        size="A4"
        style={{
          padding: 30,
          fontSize: 11,
          fontFamily: "Helvetica",
          lineHeight: 1.5,
          backgroundColor: "#ffffff",
        }}
      >
        <Text style={styles.sectionTitle}>Body Weight</Text>

        <View style={styles.bodyWeightCircle}>
          <Text style={styles.bodyWeightText}>{bmi} BMI</Text>
          <Text style={styles.bodyWeightText}>BMI</Text>
        </View>

        <Text style={styles.optimalWeightBox}>Your Average BMI was 12.9.</Text>

        <Text>
          Your Average BMI was
          <Text style={styles.boldHighlight}>12.9 BMI</Text>.
        </Text>
        <Text>
          Body Mass Index (BMI) is a simple, widely used method for assessing
          whether a person has a healthy body weight for their height. It is
          calculated by dividing a person's weight in kilograms by the square of
          their height in meters (kg/m). BMI categories include underweight
          (below 18.5), normal weight (18.5–24.9), overweight (25–29.9), and
          obese (30 and above). While BMI is a useful screening tool, it does
          not directly measure body fat and may not accurately represent the
          health of individuals with high muscle mass or those with a different
          body composition
        </Text>
        <View style={styles.container}>
          <View style={styles.gridContainer}>
            {/* Left Column: Normal Range (Light Green Box) */}
            <View style={styles.normalBox}>
              <Text style={styles.whyHeader}>If Within Normal Range?</Text>
              <Text style={styles.whyText}>
                Maintaining a healthy body weight requires a balance of mindful
                eating, regular exercise, and a positive lifestyle. Start by
                incorporating a variety of nutrient-rich foods into your diet,
                focusing on whole grains, lean proteins, and plenty of fruits
                and vegetables. Portion control is essential—listen to your
                body's hunger and fullness cues to avoid overeating. Stay active
                with a mix of cardio, strength training, and flexibility
                exercises, aiming for at least 30 minutes a day. Hydration is
                key, so drink plenty of water throughout the day to support your
                metabolism and prevent unnecessary snacking. Lastly, prioritize
                sleep and stress management, as both play a significant role in
                maintaining a healthy weight. Consistency is the secret—small,
                sustainable changes over time will lead to lasting results.
              </Text>
            </View>

            {/* Right Column: Overweight Risk (Red Box) */}
            <View style={styles.riskBox}>
              <Text style={styles.riskHeader}>Risks due to Overweight</Text>
              <Text style={styles.riskText}>
                Being overweight can lead to serious health risks, including
                cardiovascular diseases like heart disease and hypertension,
                type 2 diabetes, and joint problems such as osteoarthritis.
                Respiratory issues, like sleep apnea, and mental health
                challenges, including depression and anxiety, are also common.
                Additionally, the risk of certain cancers, such as breast,
                colon, and kidney cancer, is higher. Maintaining a healthy
                weight through balanced nutrition and regular exercise is
                crucial for reducing these risks and enhancing overall
                well-being.
              </Text>
            </View>
          </View>
        </View>
        <View>
          <Text style={styles.sectionTitle}>Suggestions:</Text>
          <View style={styles.divider} />
          <Text>
            {" "}
            Maintaining a perfect BMI requires a balanced approach that includes
            a healthy diet, regular physical activity, and lifestyle
            adjustments. Consuming a variety of nutrient-dense foods, such as
            fruits, vegetables, whole grains, lean proteins, and healthy fats,
            helps provide essential nutrients while managing calorie intake.
            Regular exercise, including both aerobic and strength-training
            activities, supports muscle health and aids in weight management.
            Staying hydrated, getting adequate sleep, and managing stress are
            also crucial for overall well-being. Consistency in these habits
            promotes a balanced BMI and supports long-term health
          </Text>
        </View>

        <Text style={styles.disclaimer}>
          Disclaimer: This report does not provide any medical advice & is not a
          clinical report. It is intended for informational purposes only. It is
          not a substitute for professional medical advice, diagnosis or
          treatment. This report is generated based on the information provided
          by you. Please talk to your doctor / health professional for any
          further treatment.
        </Text>
      </Page>
    </Document>
  );
}

function Comparison4({ data }) {
  const {
    bmi,
    musclePercentage = "",
    flowerImage,
    greenContainerImage,
    redContainerImage,
    greenStripImage,
    bottomStripImage,
    sideImage,
  } = data;

  return (
    <Document>
      <Page
        size="A4"
        style={{
          padding: 30,
          fontSize: 11,
          fontFamily: "Helvetica",
          lineHeight: 1.5,
          backgroundColor: "#ffffff",
        }}
      >
        <Text style={styles.sectionTitle}>Muscle Percentage</Text>

        <View style={styles.bodyWeightCircle}>
          <Text style={styles.bodyWeightText}>{musclePercentage} %</Text>
          <Text style={styles.bodyWeightText}>BMI</Text>
        </View>

        <Text style={styles.optimalWeightBox}>
          {" "}
          Optimal Muscle Percentage is Between 15
        </Text>

        <Text>
          <Text style={styles.boldHighlight}>
            {" "}
            Your Average Muscle percentage was 42.0%
          </Text>
          .
        </Text>
        <Text>
          Muscle percentage refers to the proportion of total body weight that
          is composed of muscle tissue. It is an important component of body
          composition analysis, providing insights into overall muscle health
          and fitness level. Muscle percentage can vary significantly based on
          factors such as age, sex, fitness level, and physical activity. Muscle
          tissue plays a vital role in metabolism, as it requires more energy
          (calories) than fat tissue to maintain. Therefore, a higher muscle
          percentage can contribute to a higher basal metabolic rate (BMR),
          which may aid in weight management and overall metabolic health.
        </Text>
        <View style={styles.container}>
          <View style={styles.gridContainer}>
            {/* Left Column: Normal Range (Light Green Box) */}
            <View style={styles.normalBox}>
              <Text style={styles.whyHeader}>If Within Normal Range?</Text>
              <Text style={styles.whyText}>muscle_8</Text>
            </View>

            {/* Right Column: Overweight Risk (Red Box) */}
            <View style={styles.riskBox}>
              <Text style={styles.riskHeader}>Risks due to Overweight</Text>
              <Text style={styles.riskText}>
                Muscle mass significantly impacts health and function. Low
                muscle mass leads to reduced physical function, increased injury
                risk, and metabolic impact. Conversely, high muscle mass
                requires more calories, may limit flexibility, hinder explosive
                movements, and strain organs. As weage, maintaining muscle
                through exercise and nutrition is crucial.
              </Text>
            </View>
          </View>
        </View>
        <View>
          <Text style={styles.sectionTitle}>Suggestions:</Text>
          <View style={styles.divider} />
          <Text>
            Maintain muscle mass through strength training, adequate protein
            intake, and a balanced caloric approach. Don’t neglect
            cardiovascular exercise, prioritize rest and recovery, and monitor
            body fat percentage. Consistency is key!.
          </Text>
        </View>

        <Text style={styles.disclaimer}>
          Disclaimer: This report does not provide any medical advice & is not a
          clinical report. It is intended for informational purposes only. It is
          not a substitute for professional medical advice, diagnosis or
          treatment. This report is generated based on the information provided
          by you. Please talk to your doctor / health professional for any
          further treatment.
        </Text>
      </Page>
    </Document>
  );
}

function Comparison5({ data }) {
  const {
    musclePercentage = "",
    flowerImage,
    greenContainerImage,
    redContainerImage,
    greenStripImage,
    bottomStripImage,
    sideImage,
  } = data;

  return (
    <Document>
      <Page
        size="A4"
        style={{
          padding: 30,
          fontSize: 11,
          fontFamily: "Helvetica",
          lineHeight: 1.5,
          backgroundColor: "#ffffff",
        }}
      >
        <Text style={styles.sectionTitle}>Fat Percentage</Text>

        <View style={styles.bodyWeightCircle}>
          <Text style={styles.bodyWeightText}>{musclePercentage} %</Text>
          <Text style={styles.bodyWeightText}>BMI</Text>
        </View>

        <Text style={styles.optimalWeightBox}>
          {" "}
          Optimal Fat Percentage is 10%
        </Text>

        <Text>
          <Text style={styles.boldHighlight}>
            1 Your Average Fat Percentage was 5.6 %
          </Text>
          .
        </Text>
        <Text>
          Fat percentage refers to the proportion of body weight that consists
          of fat tissue, encompassing essential fat necessary for normal
          physiological function and non-essential fat stored in adipose tissue.
          Healthy ranges vary by age, sex, and fitness level, generally falling
          between 10-20% for men and 18-28% for women. Maintaining a healthy fat
          percentage is crucial as excessive fat, particularly visceral fat,
          increases the risk of heart disease, diabetes, and cancer, while too
          low a percentage can lead to hormonal imbalances. Fitness goals often
          incorporate managing fat percentage to support overall health and
          optimize body composition through balanced diet and exercise choices.
        </Text>
        <View style={styles.container}>
          <View style={styles.gridContainer}>
            {/* Left Column: Normal Range (Light Green Box) */}
            <View style={styles.normalBox}>
              <Text style={styles.whyHeader}>If Within Normal Range?</Text>
              <Text style={styles.whyText}>
                A normal fat percentage reflects a healthy balance between fat
                and lean mass, supporting metabolic health and organ function.
                It reduces risks from both excess and low fat, aiding weight
                management and muscle building. This balance boosts energy,
                strength, endurance, and mobility, enhancing physical
                performance. Maintaining a normal fat percentage is a key
                indicator of progress toward optimal health and fitness goals.
              </Text>
            </View>

            {/* Right Column: Overweight Risk (Red Box) */}
            <View style={styles.riskBox}>
              <Text style={styles.riskHeader}>Risks due to Overweight</Text>
              <Text style={styles.riskText}>
                Excess fat, especially obesity, raises the risk of heart
                disease, diabetes, and joint strain, while also impacting
                athletic performance. Reducing fat typically requires changes in
                diet, exercise, and lifestyle. Too little fat, especially in
                women, can lead to hormonal issues like amenorrhea and
                compromised immune function. Solutions often include improved
                nutrition and resistance training. In both cases, consulting a
                healthcare professional is key to developing a personalized plan
                for healthy body
              </Text>
            </View>
          </View>
        </View>
        <View>
          <Text style={styles.sectionTitle}>Suggestions:</Text>
          <View style={styles.divider} />
          <Text>
            {" "}
            Maintaining a healthy fat percentage is crucial for overall health
            and fitness. For men, aiming for 10-20% body fat and for women,
            18-28% strikes a balance between essential fat and fitness. Regular
            monitoring with methods like skinfold measurements or bioelectrical
            impedance helps track progress and adjust diet and exercise as
            needed. Consulting healthcare or fitness professionals ensures
            personalized goals based on individual factors like age and health,
            supporting a healthy body composition.
          </Text>
        </View>

        <Text style={styles.disclaimer}>
          Disclaimer: This report does not provide any medical advice & is not a
          clinical report. It is intended for informational purposes only. It is
          not a substitute for professional medical advice, diagnosis or
          treatment. This report is generated based on the information provided
          by you. Please talk to your doctor / health professional for any
          further treatment.
        </Text>
      </Page>
    </Document>
  );
}
function Comparison6({ data }) {
  const {
    musclePercentage = "",
    flowerImage,
    greenContainerImage,
    redContainerImage,
    greenStripImage,
    bottomStripImage,
    sideImage,
  } = data;

  return (
    <Document>
      <Page
        size="A4"
        style={{
          padding: 30,
          fontSize: 11,
          fontFamily: "Helvetica",
          lineHeight: 1.5,
          backgroundColor: "#ffffff",
        }}
      >
        <Text style={styles.sectionTitle}>Resting Metabolism</Text>
        <View style={styles.divider} />

        <View style={styles.bodyWeightCircle}>
          <Text style={styles.bodyWeightText}>1097 Resting Metabolism</Text>
        </View>

        <Text style={styles.optimalWeightBox}>
          {" "}
          Optimal Resting Metabolism Range is Between 18.5-24.9
        </Text>

        <Text>
          <Text style={styles.boldHighlight}>
            Your Average Resting Metabolism was 1097.
          </Text>
        </Text>
        <Text>
          Resting metabolism, or basal metabolic rate (BMR), is the energy
          expended by the body at rest to maintain vital functions like
          breathing and circulation. It varies based on age, sex, body
          composition, and genetics, with muscle tissue requiring more energy
          than fat tissue. BMR is essential for managing weight and planning
          nutrition and exercise, as it determines daily calorie needs.
          Monitoring changes in BMR helps gauge metabolic health and guides
          adjustments in lifestyle for optimal energy balance and overall
          well-being
        </Text>
        <View style={styles.container}>
          <View style={styles.gridContainer}>
            {/* Left Column: Normal Range (Light Green Box) */}
            <View style={styles.normalBox}>
              <Text style={styles.whyHeader}>If Within Normal Range?</Text>
              <Text style={styles.whyText}>
                A normal resting metabolism indicates efficient energy use for
                essential functions, reflecting balanced metabolic health. It
                supports energy regulation, weight management, and overall
                well-being. Maintaining it through regular exercise and balanced
                nutrition is key to sustaining optimal health.
              </Text>
            </View>

            {/* Right Column: Overweight Risk (Red Box) */}
            <View style={styles.riskBox}>
              <Text style={styles.riskHeader}>Risks due to Overweight</Text>
              <Text style={styles.riskText}>
                An abnormal resting metabolism for your age, sex, and body
                composition may indicate metabolic variations affecting health
                and energy balance. A higher metabolism suggests increased
                energy needs, requiring dietary and exercise adjustments, while
                a lower metabolism may hinder weight management and energy
                levels. Consulting healthcare professionals can help identify
                causes and create personalized strategies to support metabolic
                health.
              </Text>
            </View>
          </View>
        </View>
        <View>
          <Text style={styles.sectionTitle}>Suggestions:</Text>
          <View style={styles.divider} />
          <Text>
            {" "}
            Optimizing resting metabolism is vital for weight management and
            health. Regular strength training builds muscle, which boosts
            metabolism since muscle burns more calories than fat. Eating regular
            meals and staying hydrated stabilize metabolism and energy levels.
            Sufficient sleep is crucial for a healthy metabolism. Avoiding
            extreme diets and consulting healthcare professionals can help
            maintain metabolism, supporting sustainable weight management and
            overall well-being.
          </Text>
        </View>

        <Text style={styles.disclaimer}>
          Disclaimer: This report does not provide any medical advice & is not a
          clinical report. It is intended for informational purposes only. It is
          not a substitute for professional medical advice, diagnosis or
          treatment. This report is generated based on the information provided
          by you. Please talk to your doctor / health professional for any
          further treatment.
        </Text>
      </Page>
    </Document>
  );
}
function Comparison7({ data }) {
  const {
    musclePercentage = "",
    flowerImage,
    greenContainerImage,
    redContainerImage,
    greenStripImage,
    bottomStripImage,
    sideImage,
  } = data;

  return (
    <Document>
      <Page
        size="A4"
        style={{
          padding: 30,
          fontSize: 11,
          fontFamily: "Helvetica",
          lineHeight: 1.5,
          backgroundColor: "#ffffff",
        }}
      >
        <View style={styles.container}>
          {/* Top Section: Key Highlights and Health Tips */}
          <Text style={styles.sectionTitle}>Your Coach</Text>
          <View style={styles.divider} />
          <View style={styles.topSection}>
            {/* Left - Key Highlights */}
            <View style={styles.highlightBox}>
              <Text style={styles.highlightTitle}>Key Highlights</Text>
              <View style={styles.weightLossBox}>
                <Text style={styles.weightText}>39.0 KG.</Text>
                <Text style={styles.weightSubText}>Weight Loss till Date</Text>
              </View>
              <Text style={styles.highlightContent}>
                You have demonstrated remarkable dedication and made significant
                improvements in several key areas over the past month. Your hard
                work and commitment to your health and wellness journey are
                truly commendable. By staying focused and maintaining this level
                of motivation, you are well on your way to achieving your health
                goals. Keep up the great work, and remember that every small
                step forward brings you closer to a healthier, happier version
                of yourself. Stay consistent, and the results will continue to
                follow!
              </Text>
            </View>

            {/* Right - Health Tips */}
            <View style={styles.healthTipsBox}>
              <Text style={styles.tipsTitle}>Important Health Tips</Text>
              {[
                {
                  tip: "Eat a Balanced Diet",
                  desc: "Incorporate a variety of fruits, vegetables, lean proteins, and whole grains into your meals to provide your body with essential nutrients.",
                },
                {
                  tip: "Get Regular Exercise",
                  desc: "Aim for at least 30 minutes of physical activity a day, whether it’s walking, cycling, or strength training, to boost your overall fitness and mental well-being.",
                },
                {
                  tip: "Prioritize Sleep",
                  desc: "Ensure you get 7–9 hours of quality sleep each night to help your body recover, improve concentration, and support immune function.",
                },
                {
                  tip: "Practice Mindfulness",
                  desc: "Meditation or deep breathing exercises help reduce stress and promote emotional balance in your daily life.",
                },
              ].map((item, index) => (
                <View style={styles.tipItem} key={index}>
                  <Image
                    source={{ uri: "/assets/PNG/alert.png" }}
                    style={styles.tipEmoji}
                  />
                  <Text style={styles.tipText}>
                    <Text style={styles.tipTitle}>{item.tip}:</Text> {item.desc}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Bottom Section: Coach */}
          <View style={styles.coachSection}>
            <Text style={styles.coachLabel}>Your Coach</Text>
            <Text style={styles.coachName}>Simarpreet</Text>
            <Text style={styles.goalText}>I want to lose 7.0 KG weight</Text>
          </View>
        </View>
        <Text style={styles.disclaimer}>
          Disclaimer: This report does not provide any medical advice & is not a
          clinical report. It is intended for informational purposes only. It is
          not a substitute for professional medical advice, diagnosis or
          treatment. This report is generated based on the information provided
          by you. Please talk to your doctor / health professional for any
          further treatment.
        </Text>
      </Page>
    </Document>
  );
}

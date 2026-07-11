import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type Step = "phone" | "otp" | "role";

const MOCK_NAMES: Record<string, string> = {
  "9876543210": "Rahul Sharma",
  "9123456789": "Priya Patel",
  "9000000001": "Amit Kumar",
};

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, logout, isLoggedIn, userRole, isLoading } = useAuth();

  React.useEffect(() => {
    if (isLoggedIn && !isLoading) {
      if (userRole === "guide") {
        router.replace("/(tabs)");
      } else {
        logout().then(() => {
          Alert.alert(
            "Access Denied",
            "The mobile app is restricted to guides only."
          );
          setStep("phone");
          setPhone("");
        });
      }
    }
  }, [isLoggedIn, userRole, isLoading, logout]);

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const otpRefs = useRef<Array<TextInput | null>>([null, null, null, null, null, null]);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handleSendOTP = () => {
    if (phone.length !== 10) {
      Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
    }, 1000);
  };

  const handleOTPDigit = (text: string, index: number) => {
    const newDigits = [...otpDigits];
    newDigits[index] = text;
    setOtpDigits(newDigits);
    if (text && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    if (newDigits.every((d) => d !== "")) {
      handleVerifyOTP(newDigits.join(""));
    }
  };

  const handleOTPBackspace = (key: string, index: number) => {
    if (key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = (code: string) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (code.length === 6) {
        handleRoleSelect("guide");
      } else {
        Alert.alert("Invalid OTP", "Please enter a valid 6-digit code.");
        setOtpDigits(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      }
    }, 1000);
  };

  const handleRoleSelect = async (role: "guide" | "admin") => {
    setLoading(true);
    try {
      await login(phone, role);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      const errMsg = error?.message || String(error);
      const isRoleMismatch = 
        errMsg.toLowerCase().includes("mismatch") || 
        errMsg.includes("401") || 
        errMsg.toLowerCase().includes("unauthorized");
      
      if (isRoleMismatch) {
        Alert.alert(
          "Access Denied",
          "The mobile app is restricted to guides only."
        );
      } else {
        Alert.alert(
          "Connection Failed",
          `Unable to log in: ${errMsg}\n\nPlease check if the backend API server is running locally on port 5000.`
        );
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topInset + 40, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Branding */}
          <View style={styles.brand}>
            <View style={[styles.logoWrap, { borderColor: colors.primary, backgroundColor: `${colors.primary}12` }]}>
              <Ionicons name="compass" size={42} color={colors.primary} />
            </View>
            <Text style={[styles.brandName, { color: colors.foreground }]}>YouthCamping</Text>
            <Text style={[styles.brandSub, { color: colors.mutedForeground }]}>Guide Operations Platform</Text>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

            {step === "phone" && (
              <>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Welcome Back</Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                  Enter your registered mobile number to continue
                </Text>
                <View style={[styles.phoneRow, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
                  <Text style={[styles.countryCode, { color: colors.mutedForeground }]}>+91</Text>
                  <View style={[styles.phoneDivider, { backgroundColor: colors.border }]} />
                  <TextInput
                    style={[styles.phoneInput, { color: colors.foreground }]}
                    placeholder="10-digit mobile number"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                    returnKeyType="done"
                    onSubmitEditing={handleSendOTP}
                    editable={!loading}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.btn, { opacity: loading ? 0.7 : 1 }]}
                  onPress={handleSendOTP}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#FF6B00", "#FF8800"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    {loading
                      ? <ActivityIndicator color="#070B14" />
                      : <Text style={styles.btnText}>Send OTP</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>
                <Text style={[styles.demoHint, { color: colors.mutedForeground }]}>
                  Demo: Use 9876543210 or any 10-digit number
                </Text>
              </>
            )}

            {step === "otp" && (
              <>
                <TouchableOpacity
                  onPress={() => { setStep("phone"); setOtpDigits(["", "", "", "", "", ""]); }}
                  style={styles.backBtn}
                  disabled={loading}
                >
                  <Ionicons name="arrow-back" size={20} color={colors.mutedForeground} />
                  <Text style={[styles.backBtnText, { color: colors.mutedForeground }]}>Back</Text>
                </TouchableOpacity>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Verify OTP</Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                  Code sent to +91 {phone}
                </Text>
                <View style={styles.otpRow}>
                  {otpDigits.map((digit, i) => (
                    <TextInput
                      key={i}
                      ref={(r) => { otpRefs.current[i] = r; }}
                      style={[
                        styles.otpBox,
                        {
                          borderColor: digit ? colors.primary : colors.border,
                          backgroundColor: colors.secondary,
                          color: colors.foreground,
                        },
                      ]}
                      maxLength={1}
                      keyboardType="number-pad"
                      value={digit}
                      onChangeText={(t) => handleOTPDigit(t, i)}
                      onKeyPress={({ nativeEvent }) => handleOTPBackspace(nativeEvent.key, i)}
                      textAlign="center"
                      editable={!loading}
                    />
                  ))}
                </View>
                {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />}
                <TouchableOpacity style={styles.resendWrap} disabled={loading}>
                  <Text style={[styles.resendText, { color: colors.mutedForeground }]}>
                    Didn't receive?{" "}
                    <Text style={{ color: colors.primary }}>Resend OTP</Text>
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.demoHint, { color: colors.mutedForeground }]}>
                  Demo: Enter any 6 digits
                </Text>
              </>
            )}
          </View>

          <Text style={[styles.footer, { color: colors.mutedForeground }]}>
            © 2025 YouthCamping. All rights reserved.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  brand: { alignItems: "center", marginBottom: 44 },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: 26,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  brandName: { fontSize: 28, fontFamily: "Montserrat_700Bold", letterSpacing: 0.5, marginBottom: 6 },
  brandSub: { fontSize: 13, fontFamily: "Montserrat_400Regular", letterSpacing: 0.3 },
  card: { borderRadius: 22, padding: 28, borderWidth: 1 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 18 },
  backBtnText: { fontSize: 14, fontFamily: "Montserrat_500Medium" },
  cardTitle: { fontSize: 22, fontFamily: "Montserrat_700Bold", marginBottom: 8 },
  cardSub: { fontSize: 14, fontFamily: "Montserrat_400Regular", lineHeight: 20, marginBottom: 28 },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  countryCode: { fontSize: 15, fontFamily: "Montserrat_500Medium", marginRight: 12 },
  phoneDivider: { width: 1, height: 24, marginRight: 12 },
  phoneInput: { flex: 1, fontSize: 16, fontFamily: "Montserrat_500Medium" },
  btn: { borderRadius: 14, overflow: "hidden" },
  btnGradient: { height: 56, justifyContent: "center", alignItems: "center" },
  btnText: { fontSize: 15, fontFamily: "Montserrat_700Bold", color: "#FFFFFF", letterSpacing: 0.3 },
  otpRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  otpBox: {
    width: 44,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 22,
    fontFamily: "Montserrat_700Bold",
  },
  resendWrap: { alignItems: "center", marginBottom: 12 },
  resendText: { fontSize: 13, fontFamily: "Montserrat_400Regular" },
  demoHint: { fontSize: 11, fontFamily: "Montserrat_400Regular", textAlign: "center", marginTop: 8 },
  roleBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  roleIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  roleName: { fontSize: 15, fontFamily: "Montserrat_600SemiBold", marginBottom: 4 },
  roleDesc: { fontSize: 12, fontFamily: "Montserrat_400Regular", lineHeight: 16 },
  footer: { textAlign: "center", fontSize: 11, fontFamily: "Montserrat_400Regular", marginTop: 32 },
});

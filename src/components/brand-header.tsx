import React, { memo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import i18n from "../i18n";
import { useTranslation } from "react-i18next";

const BrandHeader = () => {
  const isRTL = i18n.dir() === "rtl";
  const { t } = useTranslation();
  const styles = StyleSheet.create({
    brandRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      marginBottom: 10,
    },
    brandLogo: {
      width: 64,
      height: 64,
    },
    brandTitle: {
      fontSize: 20,
      fontWeight: "bold",
      textAlign: isRTL ? "right" : "left",
    },
    brandSubtitle: {
      fontSize: 14,
      color: "#4e4d4dff",
      textAlign: isRTL ? "right" : "left",
      paddingHorizontal: 2,
    },
  });

  return (
    <View style={styles.brandRow}>
      <Image
        source={require("../../assets/icon.png")}
        style={styles.brandLogo}
      />
      <View>
        <Text style={styles.brandTitle}>{t("app_name")}</Text>
        <Text style={styles.brandSubtitle}>{t("app_description")}</Text>
      </View>
    </View>
  );
};

export default memo(BrandHeader);

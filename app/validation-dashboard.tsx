
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { validationService, ValidationReport } from '@/utils/validationService';
import { performanceMonitor } from '@/utils/performanceMonitor';

export default function ValidationDashboard() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const runValidation = async () => {
    setIsRunning(true);
    try {
      const validationReport = await validationService.runFullValidation();
      setReport(validationReport);
      
      if (validationReport.overallStatus === 'PASS') {
        Alert.alert(
          '✅ All Tests Passed!',
          'Your app is production-ready and all validation checks have passed.',
          [{ text: 'Great!', style: 'default' }]
        );
      } else if (validationReport.overallStatus === 'FAIL') {
        Alert.alert(
          '❌ Validation Failed',
          `${validationReport.summary.failed} test(s) failed. Please review the details below.`,
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to run validation: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const exportReport = () => {
    if (!report) return;
    
    const reportJson = validationService.exportReport();
    console.log('📄 Validation Report:', reportJson);
    Alert.alert(
      'Report Exported',
      'The validation report has been logged to the console. In production, this would be saved to a file or sent to your monitoring service.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? '✅' : '❌';
  };

  const getStatusColor = (passed: boolean) => {
    return passed ? colors.success : colors.error;
  };

  const renderCategorySection = (
    title: string,
    categoryKey: keyof ValidationReport['categories'],
    icon: string
  ) => {
    if (!report) return null;

    const results = report.categories[categoryKey];
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const isExpanded = showDetails === categoryKey;

    return (
      <View style={styles.categorySection}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => setShowDetails(isExpanded ? null : categoryKey)}
        >
          <View style={styles.categoryTitleRow}>
            <Text style={styles.categoryIcon}>{icon}</Text>
            <View style={styles.categoryTitleContainer}>
              <Text style={styles.categoryTitle}>{title}</Text>
              <Text style={styles.categorySubtitle}>
                {passed}/{total} passed
              </Text>
            </View>
          </View>
          <IconSymbol
            ios_icon_name={isExpanded ? 'chevron.up' : 'chevron.down'}
            android_material_icon_name={isExpanded ? 'expand_less' : 'expand_more'}
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.categoryDetails}>
            {results.map((result, index) => (
              <View key={index} style={styles.testResult}>
                <Text style={styles.testStatus}>{getStatusIcon(result.passed)}</Text>
                <View style={styles.testInfo}>
                  <Text style={styles.testName}>{result.message}</Text>
                  <Text style={styles.testDetails}>{result.details}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Validation Dashboard</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Pre-Flight Validation</Text>
          <Text style={styles.infoText}>
            Run comprehensive tests to ensure your app is production-ready. This includes backend API validation, frontend flow testing, FTUE checks, performance monitoring, and deployment readiness.
          </Text>
        </View>

        <TouchableOpacity
          style={[buttonStyles.primary, styles.runButton]}
          onPress={runValidation}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator color={colors.card} />
          ) : (
            <>
              <IconSymbol
                ios_icon_name="play.fill"
                android_material_icon_name="play_arrow"
                size={20}
                color={colors.card}
              />
              <Text style={[buttonStyles.text, { marginLeft: 8 }]}>
                Run Full Validation
              </Text>
            </>
          )}
        </TouchableOpacity>

        {report && (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Validation Summary</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{report.summary.totalTests}</Text>
                  <Text style={styles.summaryLabel}>Total Tests</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNumber, { color: colors.success }]}>
                    {report.summary.passed}
                  </Text>
                  <Text style={styles.summaryLabel}>Passed</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNumber, { color: colors.error }]}>
                    {report.summary.failed}
                  </Text>
                  <Text style={styles.summaryLabel}>Failed</Text>
                </View>
              </View>
              <View style={styles.overallStatus}>
                <Text style={styles.overallStatusLabel}>Overall Status:</Text>
                <Text
                  style={[
                    styles.overallStatusValue,
                    {
                      color:
                        report.overallStatus === 'PASS'
                          ? colors.success
                          : report.overallStatus === 'FAIL'
                          ? colors.error
                          : colors.warning,
                    },
                  ]}
                >
                  {report.overallStatus}
                </Text>
              </View>
            </View>

            {renderCategorySection('Backend APIs', 'backend', '🔌')}
            {renderCategorySection('Frontend Flows', 'frontend', '📱')}
            {renderCategorySection('First-Time User Experience', 'ftue', '👋')}
            {renderCategorySection('Performance', 'performance', '⚡')}
            {renderCategorySection('Deployment Readiness', 'deployment', '🚀')}

            <TouchableOpacity
              style={[buttonStyles.outline, styles.exportButton]}
              onPress={exportReport}
            >
              <IconSymbol
                ios_icon_name="square.and.arrow.up"
                android_material_icon_name="file_upload"
                size={20}
                color={colors.primary}
              />
              <Text style={[buttonStyles.outlineText, { marginLeft: 8 }]}>
                Export Report
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  runButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  overallStatus: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  overallStatusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: 8,
  },
  overallStatusValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  categorySection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  categoryDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
    paddingTop: 12,
  },
  testResult: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  testStatus: {
    fontSize: 16,
    marginRight: 12,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  testDetails: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  exportButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
});

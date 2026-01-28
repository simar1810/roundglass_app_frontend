"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Settings,
  BarChart3,
  Calendar,
  Download,
  Palette,
  RefreshCw,
  Bell,
  Eye,
  RotateCcw,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { useAnalyticsSettings } from "@/hooks/useAnalyticsSettings";
import { AVAILABLE_METRICS } from "./MetricSelector";
import MetricSelector from "./MetricSelector";

export default function AnalyticsSettings() {
  const { settings, updateSetting, resetToDefaults } = useAnalyticsSettings();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Settings are auto-saved via localStorage hook
    setSaved(true);
    toast.success("Settings saved successfully");
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      resetToDefaults();
      toast.success("Settings reset to defaults");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics Settings</h1>
          <p className="text-muted-foreground">
            Customize your analytics display and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saved}>
            <Save className="h-4 w-4 mr-2" />
            {saved ? "Saved!" : "Save"}
          </Button>
        </div>
      </div>

      {/* Default Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Default Metrics</CardTitle>
          </div>
          <CardDescription>
            Select default metrics to show when opening analytics views
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Default Selected Metrics</Label>
            <MetricSelector
              value={settings.defaultMetrics || []}
              onChange={(metrics) => updateSetting("defaultMetrics", metrics)}
              label="Select default metrics"
              showLabel={false}
            />
            <p className="text-xs text-muted-foreground mt-2">
              These metrics will be pre-selected when you open analytics views
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chart Type Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Chart Type Preferences</CardTitle>
          </div>
          <CardDescription>
            Choose your preferred chart types for different analytics views
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Category Comparison</Label>
              <Select
                value={settings.chartTypes?.categoryComparison || "bar"}
                onValueChange={(value) =>
                  updateSetting("chartTypes.categoryComparison", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="radar">Radar Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Trends Analysis</Label>
              <Select
                value={settings.chartTypes?.trends || "line"}
                onValueChange={(value) =>
                  updateSetting("chartTypes.trends", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Correlations</Label>
              <Select
                value={settings.chartTypes?.correlations || "scatter"}
                onValueChange={(value) =>
                  updateSetting("chartTypes.correlations", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scatter">Scatter Plot</SelectItem>
                  <SelectItem value="heatmap">Heatmap</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Distribution</Label>
              <Select
                value={settings.chartTypes?.distribution || "boxplot"}
                onValueChange={(value) =>
                  updateSetting("chartTypes.distribution", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boxplot">Box Plot</SelectItem>
                  <SelectItem value="histogram">Histogram</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Preferences</Label>
              <Select
                value={settings.chartTypes?.preferences || "bar"}
                onValueChange={(value) =>
                  updateSetting("chartTypes.preferences", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Range Defaults */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg">Date Range Defaults</CardTitle>
          </div>
          <CardDescription>
            Set default date ranges for different analytics views
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Trends Analysis</Label>
              <Select
                value={settings.dateRangeDefaults?.trends || "3months"}
                onValueChange={(value) =>
                  updateSetting("dateRangeDefaults.trends", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1week">Last Week</SelectItem>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Category Comparison</Label>
              <Select
                value={settings.dateRangeDefaults?.comparison || "all"}
                onValueChange={(value) =>
                  updateSetting("dateRangeDefaults.comparison", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1week">Last Week</SelectItem>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Format Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Export Format</CardTitle>
          </div>
          <CardDescription>
            Choose your preferred export format for analytics data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Default Export Format</Label>
            <Select
              value={settings.exportFormat || "csv"}
              onValueChange={(value) => updateSetting("exportFormat", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Comma Separated Values)</SelectItem>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="pdf">PDF Document</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Note: Some formats may require additional processing time
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Display Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg">Display Preferences</CardTitle>
          </div>
          <CardDescription>
            Customize how analytics data is displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Percentiles</Label>
                <p className="text-xs text-muted-foreground">
                  Display percentile rankings in analytics views
                </p>
              </div>
              <Switch
                checked={settings.display?.showPercentiles !== false}
                onCheckedChange={(checked) =>
                  updateSetting("display.showPercentiles", checked)
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Trends</Label>
                <p className="text-xs text-muted-foreground">
                  Display trend indicators and direction arrows
                </p>
              </div>
              <Switch
                checked={settings.display?.showTrends !== false}
                onCheckedChange={(checked) =>
                  updateSetting("display.showTrends", checked)
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Correlations</Label>
                <p className="text-xs text-muted-foreground">
                  Display correlation analysis in relevant views
                </p>
              </div>
              <Switch
                checked={settings.display?.showCorrelations !== false}
                onCheckedChange={(checked) =>
                  updateSetting("display.showCorrelations", checked)
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Use a more compact layout with less spacing
                </p>
              </div>
              <Switch
                checked={settings.display?.compactMode || false}
                onCheckedChange={(checked) =>
                  updateSetting("display.compactMode", checked)
                }
              />
            </div>

            <Separator />

            <div>
              <Label>Chart Height</Label>
              <Select
                value={String(settings.display?.chartHeight || 400)}
                onValueChange={(value) =>
                  updateSetting("display.chartHeight", parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Small (300px)</SelectItem>
                  <SelectItem value="400">Medium (400px)</SelectItem>
                  <SelectItem value="500">Large (500px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-pink-600" />
            <CardTitle className="text-lg">Theme Preferences</CardTitle>
          </div>
          <CardDescription>
            Customize the visual appearance of charts and tables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Chart Color Scheme</Label>
              <Select
                value={settings.theme?.chartColors || "default"}
                onValueChange={(value) =>
                  updateSetting("theme.chartColors", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="vibrant">Vibrant</SelectItem>
                  <SelectItem value="pastel">Pastel</SelectItem>
                  <SelectItem value="monochrome">Monochrome</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Table Density</Label>
              <Select
                value={settings.theme?.tableDensity || "comfortable"}
                onValueChange={(value) =>
                  updateSetting("theme.tableDensity", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Refresh Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-cyan-600" />
            <CardTitle className="text-lg">Auto-Refresh</CardTitle>
          </div>
          <CardDescription>
            Configure automatic data refresh for analytics views
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Auto-Refresh</Label>
              <p className="text-xs text-muted-foreground">
                Automatically refresh analytics data at regular intervals
              </p>
            </div>
            <Switch
              checked={settings.autoRefresh?.enabled || false}
              onCheckedChange={(checked) =>
                updateSetting("autoRefresh.enabled", checked)
              }
            />
          </div>

          {settings.autoRefresh?.enabled && (
            <>
              <Separator />
              <div>
                <Label>Refresh Interval (seconds)</Label>
                <Input
                  type="number"
                  min="30"
                  step="30"
                  value={(settings.autoRefresh?.interval || 60000) / 1000}
                  onChange={(e) =>
                    updateSetting(
                      "autoRefresh.interval",
                      parseInt(e.target.value) * 1000
                    )
                  }
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Minimum: 30 seconds
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-lg">Notifications</CardTitle>
          </div>
          <CardDescription>
            Choose which notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Data Updated</Label>
                <p className="text-xs text-muted-foreground">
                  Notify when analytics data is updated
                </p>
              </div>
              <Switch
                checked={settings.notifications?.dataUpdated || false}
                onCheckedChange={(checked) =>
                  updateSetting("notifications.dataUpdated", checked)
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Export Complete</Label>
                <p className="text-xs text-muted-foreground">
                  Notify when data export is complete
                </p>
              </div>
              <Switch
                checked={settings.notifications?.exportComplete !== false}
                onCheckedChange={(checked) =>
                  updateSetting("notifications.exportComplete", checked)
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Error Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Show alerts when errors occur
                </p>
              </div>
              <Switch
                checked={settings.notifications?.errorAlerts !== false}
                onCheckedChange={(checked) =>
                  updateSetting("notifications.errorAlerts", checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


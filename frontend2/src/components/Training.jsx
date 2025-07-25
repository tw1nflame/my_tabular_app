import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { 
  Play, 
  Pause, 
  Square, 
  TrendingUp, 
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Database,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { API_BASE_URL } from '../apiConfig.js'
import DbAutoSavePanel from './training/DbAutoSavePanel.jsx';
import TrainingControl from './training/TrainingControl.jsx';
import ModelLeaderboard from './training/ModelLeaderboard.jsx';
import ModelMetricsCards from './training/ModelMetricsCards.jsx';
import { useTrainingLogic } from '../hooks/useTrainingLogic.jsx';
import PredictionPreview from './training/PredictionPreview.jsx';

export default function Training() {
  const navigate = useNavigate();
  const { 
    uploadedFile, 
    trainingConfig, 
    setSessionId,
    updateTrainingStatus,
    sessionId,
    trainingStatus: globalTrainingStatus,
    totalTrainingTime,
    setTotalTrainingTime,
    authToken,
    setAuthToken,
    predictionProcessed,
    uploadedData, predictionRows,
    trainFile,
    predictFile,
    autoSaveEnabled,
    setAutoSaveEnabled
  } = useData();
  const {
    dbUsername, setDbUsername,
    dbPassword, setDbPassword,
    dbConnecting, dbConnected, dbError, dbTables, dbTablesLoading,
    selectedSchema, setSelectedSchema, selectedTable, setSelectedTable,
    saveTableName, setSaveTableName, autoSaveMenuOpen, setAutoSaveMenuOpen,
    saveMode, setSaveMode, newTableName, setNewTableName, autoSaveSettings, uploadTableName,
    handleDbConnect, handleDbInputChange, handleSchemaChange, handleTableChange, handleAutoSaveSetup,
    fileColumns,
    getTrainingStatus, handleStartTraining, getCurrentProgress, getStatusMessage, getBestModel, getBestModelMetric, getAverageMetric, elapsedTime,
  } = useTrainingLogic({
    uploadedFile,
    trainingConfig,
    setSessionId,
    updateTrainingStatus,
    sessionId,
    globalTrainingStatus,
    setTotalTrainingTime,
    authToken,
    setAuthToken
  });

  // Глобальные PK
  const { selectedPrimaryKeys, setSelectedPrimaryKeys } = useData();

  // Определяем название метрики для отображения
  const metricName = globalTrainingStatus?.training_params?.evaluation_metric || trainingConfig?.selectedMetric || '';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Обучение и прогнозирование</h1>
        <p className="text-muted-foreground">
          Запустите процесс обучения моделей и просмотрите результаты прогнозирования
        </p>
      </div>
      <div className="space-y-6">
        <DbAutoSavePanel
          autoSaveEnabled={autoSaveEnabled}
          setAutoSaveEnabled={setAutoSaveEnabled}
          dbUsername={dbUsername}
          setDbUsername={setDbUsername}
          dbPassword={dbPassword}
          setDbPassword={setDbPassword}
          dbConnecting={dbConnecting}
          dbConnected={dbConnected}
          dbError={dbError}
          dbTables={dbTables}
          dbTablesLoading={dbTablesLoading}
          selectedSchema={selectedSchema}
          setSelectedSchema={setSelectedSchema}
          selectedTable={selectedTable}
          setSelectedTable={setSelectedTable}
          saveTableName={saveTableName}
          setSaveTableName={setSaveTableName}
          autoSaveMenuOpen={autoSaveMenuOpen}
          setAutoSaveMenuOpen={setAutoSaveMenuOpen}
          saveMode={saveMode}
          setSaveMode={setSaveMode}
          newTableName={newTableName}
          setNewTableName={setNewTableName}
          autoSaveSettings={autoSaveSettings}
          uploadTableName={uploadTableName}
          handleDbConnect={handleDbConnect}
          handleDbInputChange={handleDbInputChange}
          handleSchemaChange={handleSchemaChange}
          handleTableChange={handleTableChange}
          handleAutoSaveSetup={handleAutoSaveSetup}
          fileColumns={fileColumns}
          selectedPrimaryKeys={selectedPrimaryKeys}
          setSelectedPrimaryKeys={setSelectedPrimaryKeys}
          setAuthToken={setAuthToken}
        />
        <TrainingControl
          getTrainingStatus={getTrainingStatus}
          handleStartTraining={handleStartTraining}
          trainingConfig={trainingConfig}
          trainFile={trainFile}
          predictFile={predictFile}
          getCurrentProgress={getCurrentProgress}
          elapsedTime={elapsedTime}
          getStatusMessage={getStatusMessage}
          globalTrainingStatus={globalTrainingStatus}
        />
        <ModelLeaderboard
          leaderboard={globalTrainingStatus?.leaderboard}
          trainingParams={globalTrainingStatus?.training_params}
          trainingConfig={trainingConfig}
          formatCellValue={(key, value) => value == null ? '' : value}
        />
        <PredictionPreview predictionRows={predictionRows} />
        {/* Значимость признаков */}
        {globalTrainingStatus?.feature_importance && Array.isArray(globalTrainingStatus.feature_importance) && globalTrainingStatus.feature_importance.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="text-primary" size={20} />
                  <span>Значимость признаков</span>
                </div>
              </CardTitle>
              <CardDescription>
                Вклад каждого признака в итоговую модель (чем выше, тем важнее)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Признак</th>
                      <th className="text-left p-3 font-medium">Значимость</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalTrainingStatus.feature_importance.map((f, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="p-3">{f.feature}</td>
                        <td className="p-3">{f.importance?.toFixed ? f.importance.toFixed(4) : f.importance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
        <ModelMetricsCards
          bestModel={getBestModel()}
          bestModelMetric={getBestModelMetric()}
          averageMetric={getAverageMetric()}
          totalTrainingTime={totalTrainingTime}
          predictionProcessed={predictionProcessed}
          metricName={metricName}
        />
        <div className="flex justify-between items-center">
          <Button 
            variant="outline"
            onClick={() => navigate('/config')}
          >
            Назад к конфигурации
          </Button>
          <div className="flex flex-row gap-4">
            <Button 
              variant="outline" 
              className="flex items-center space-x-2"
              onClick={() => navigate('/export')}
              disabled={!predictionProcessed}
              title={predictionProcessed ? '' : 'Сначала выполните прогнозирование'}
            >
              <Download size={16} />
              <span>Скачать результаты</span>
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => navigate('/analysis')}
              disabled={!uploadedFile}
              title={uploadedFile ? '' : 'Сначала загрузите файл'}
            >
              Перейти к анализу
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

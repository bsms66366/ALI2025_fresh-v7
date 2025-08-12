import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Platform, NativeSyntheticEvent, ImageSourcePropType, Pressable, ActivityIndicator, Button, ViewProps } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import {
  ViroARScene,
  ViroARSceneNavigator,
  Viro3DObject,
  ViroAmbientLight,
  ViroSpotLight,
  ViroNode,
  ViroMaterials,
  ViroErrorEvent,
  ViroPinchStateTypes,
  ViroRotateStateTypes,
} from '@reactvision/react-viro';

// Type for mesh loading event
type ViroMeshLoadedEvent = {
  meshNames: string[];
};

// Type for Viro3DObject props
type CustomViro3DObjectProps = ViewProps & {
  source: { uri: string };
  type: 'GLB';
  scale: [number, number, number];
  position: [number, number, number];
  rotation: [number, number, number];
  materials?: string[];
  highAccuracyEvents?: boolean;
  onError?: (event: NativeSyntheticEvent<any>) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onMeshesLoaded?: (event: NativeSyntheticEvent<ViroMeshLoadedEvent>) => void;
};
import { useLocalSearchParams, router} from 'expo-router';

// Helper function to extract error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error occurred';
};

import { AnatomyMaterials, getModelScale, type MaterialConfig, type LightingModel } from '../../components/modelConfig';

import { MeshMaterialMap } from '../../components/modelConfig';

// Configure materials for 3D models
const configureMeshMaterials = (meshNames?: string[]) => {
  // Create all materials
  ViroMaterials.createMaterials({
    defaultMaterial: AnatomyMaterials.default,
    muscleMaterial: AnatomyMaterials.muscle,
    cartilageMaterial: AnatomyMaterials.cartilage,
    tissueMaterial: AnatomyMaterials.tissue,
  });
  
  if (meshNames && meshNames.length > 0) {
    // Map mesh names to materials
    const materials = meshNames.map(meshName => {
      // Try to find a specific material for this mesh
      const materialName = MeshMaterialMap[meshName.toLowerCase()];
      return materialName || 'defaultMaterial';
    });
    console.log('Applying materials:', materials, 'to meshes:', meshNames);
    return materials;
  }
  
  // Return default material if no mesh names provided
  return ['defaultMaterial'];
};

// Download model to local file system
const downloadModel = async (
  uri: string, 
  onProgress: (progress: number) => void
): Promise<string> => {
  try {
    // Create a unique filename based on the URI
    const filename = `model_${Date.now()}_${uri.split('/').pop() || 'model.glb'}`;
    const modelDir = `${FileSystem.documentDirectory}models/`;
    const localUri = `${modelDir}${filename}`;

    // Create models directory if it doesn't exist
    const dirInfo = await FileSystem.getInfoAsync(modelDir);
    if (!dirInfo.exists) {
      console.log('Creating models directory:', modelDir);
      await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true });
    }

    // Check if we already have this model downloaded
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists) {
      console.log('Model already exists locally:', localUri);
      return localUri;
    }

    console.log('Downloading model:', uri, 'to', localUri);
    const downloadResumable = FileSystem.createDownloadResumable(
      uri,
      localUri,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        console.log(`Download progress: ${Math.round(progress * 100)}%`);
        onProgress(progress);
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (!result?.uri) {
      throw new Error('Download failed - no URI in result');
    }

    // Verify the downloaded file
    const downloadedFileInfo = await FileSystem.getInfoAsync(result.uri);
    if (!downloadedFileInfo.exists || downloadedFileInfo.size === 0) {
      throw new Error('Downloaded file is empty or missing');
    }

    console.log('Model downloaded successfully:', result.uri);
    return result.uri;
  } catch (error) {
    console.error('Error downloading model:', error);
    throw error;
  }
};

// Type for ViroARSceneNavigator props
type ViroARSceneNavigatorProps = {
  initialScene: {
    scene: React.ComponentType<SceneProps>;
  };
  viroAppProps: {
    modelUri: string;
  };
  autofocus?: boolean;
  style?: any;
};

// Type for scene props from ViroARSceneNavigator
type SceneProps = {
  sceneNavigator: {
    viroAppProps: {
      modelUri: string;
      materialMappings?: Record<string, string>; // Map mesh names to material names
    };
  };
};

// Type for ARScene props
type ARSceneProps = SceneProps & {
  onError: (error: unknown) => void;
  onLoadStart: () => void;
  onLoadEnd: () => void;
};

// LoadingIndicator component
const LoadingIndicator: React.FC<{ progress?: number; message: string }> = ({ progress, message }) => (
  <View style={styles.overlay}>
    <View style={styles.loadingBox}>
      <ActivityIndicator size="large" color="#ffd33d" />
      <Text style={styles.loadingText}>{message}</Text>
      {progress !== undefined && (
        <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
      )}
    </View>
  </View>
);

// ARScene component
const ARScene = (props: ARSceneProps) => {
  const { sceneNavigator, onError, onLoadStart, onLoadEnd } = props;
  const modelUri = sceneNavigator?.viroAppProps?.modelUri || '';
  const [position, setPosition] = useState<[number, number, number]>([0, -0.5, -1]);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [scale, setScale] = useState<[number, number, number]>([0.1, 0.1, 0.1]);
  const [materials, setMaterials] = useState<string[]>(['defaultMaterial']);
  const [meshNames, setMeshNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Double-tap reset state
  const [lastTapTime, setLastTapTime] = useState(0);
  const [initialScale, setInitialScale] = useState<[number, number, number]>([0.1, 0.1, 0.1]);
  
  // Pinch gesture tracking for better zoom detection
  const [lastPinchFactor, setLastPinchFactor] = useState(1.0);
  const [isPinching, setIsPinching] = useState(false);

  // Handle material assignment for different meshes
  const handleLoadMeshMaterials = (meshNames: string[]) => {
    const configuredMaterials = configureMeshMaterials(meshNames);
    setMaterials(configuredMaterials);
  };

  const handleError = (event: NativeSyntheticEvent<ViroErrorEvent>) => {
    console.error('AR Scene error:', event.nativeEvent);
    onError(event.nativeEvent);
  };

  const handleLoadStart = () => {
    console.log('Model load starting');
    setIsLoading(true);
    onLoadStart();
  };

  const handleLoadEnd = () => {
    console.log('Model loaded successfully');
    setIsLoading(false);
    if (onLoadEnd) {
      onLoadEnd();
    }
    
    // Auto-configure materials after model loads
    if (meshNames.length > 0) {
      const configuredMaterials = configureMeshMaterials(meshNames);
      setMaterials(configuredMaterials);
    }
    
    // Apply model-specific scaling
    const modelScale = getModelScale(modelUri);
    if (modelScale) {
      console.log(`Applying model-specific scale: ${modelScale}`);
      setScale(modelScale);
      setInitialScale(modelScale); // Store initial scale for reset
    }
  };

  // Handle pinch to zoom with robust detection for both zoom-in and zoom-out
  const onPinch = (pinchState: ViroPinchStateTypes, scaleFactor: number, source: ImageSourcePropType) => {
    console.log(`Pinch event: state=${pinchState}, factor=${scaleFactor}, current scale=${scale[0]}`);
    
    // Handle pinch start
    if (pinchState === ViroPinchStateTypes.PINCH_START) {
      // Check for double-tap reset
      if (handleDoubleTapReset()) {
        return; // Exit early if reset was triggered
      }
      
      // Initialize pinch tracking
      setLastPinchFactor(scaleFactor);
      setIsPinching(true);
      console.log(`🟢 Pinch started with factor: ${scaleFactor}`);
      return;
    }
    
    // Handle pinch end
    if (pinchState === ViroPinchStateTypes.PINCH_END) {
      setIsPinching(false);
      setLastPinchFactor(1.0);
      console.log(`🔴 Pinch ended`);
      return;
    }
    
    // Handle pinch move - this is where we apply scaling
    if (pinchState === ViroPinchStateTypes.PINCH_MOVE && isPinching) {
      
      // Calculate the change in pinch factor since last frame
      const factorDelta = scaleFactor / lastPinchFactor;
      console.log(`📏 Factor delta: ${factorDelta} (current: ${scaleFactor}, last: ${lastPinchFactor})`);
      
      // Apply the delta with smoothing
      const smoothedFactor = 1 + (factorDelta - 1) * 0.3; // Light smoothing
      
      console.log(`🎯 Smoothed factor: ${smoothedFactor}, will multiply scale ${scale[0]} by ${smoothedFactor}`);
      
      // Calculate new scale
      const newScale: [number, number, number] = [
        scale[0] * smoothedFactor, 
        scale[1] * smoothedFactor, 
        scale[2] * smoothedFactor
      ];
      
      console.log(`📐 Calculated new scale: ${newScale[0]}`);
      
      // Very generous scale limits
      const MIN_SCALE = 0.0001;
      const MAX_SCALE = 5.0;
      
      // Apply scale if within limits
      if (newScale[0] >= MIN_SCALE && newScale[0] <= MAX_SCALE) {
        setScale(newScale);
        console.log(`✅ Scale successfully updated to: ${newScale[0]}`);
      } else {
        console.log(`❌ Scale ${newScale[0]} outside limits [${MIN_SCALE}, ${MAX_SCALE}]`);
      }
      
      // Update last pinch factor for next frame
      setLastPinchFactor(scaleFactor);
    }
  };

  // Handle drag to move
  const onDrag = (draggedToPosition: [number, number, number], source: ImageSourcePropType) => {
    console.log(`Drag event: position=[${draggedToPosition}]`);
    
    if (draggedToPosition) {
      // Apply the position change immediately for better responsiveness
      setPosition(draggedToPosition);
    }
  };

  // Handle rotation with improved sensitivity
  const onRotate = (rotateState: ViroRotateStateTypes, rotationFactor: number, source: ImageSourcePropType) => {
    console.log(`Rotate event: state=${rotateState}, factor=${rotationFactor}`);
    
    if (rotateState === ViroRotateStateTypes.ROTATE_START ||
        rotateState === ViroRotateStateTypes.ROTATE_MOVE ||
        rotateState === ViroRotateStateTypes.ROTATE_END) {
      
      // Improved rotation with better sensitivity and smoothing
      const sensitivity = 45; // Degrees per unit (was ~57.3)
      const smoothedRotation = rotationFactor * 0.7; // Dampen by 30% for smoother rotation
      
      const newRotation: [number, number, number] = [
        rotation[0], 
        rotation[1] + (smoothedRotation * sensitivity),
        rotation[2]
      ];
      
      setRotation(newRotation);
    }
  };

  // Handle double-tap to reset model (integrated with pinch gesture)
  const handleDoubleTapReset = () => {
    const now = Date.now();
    if (now - lastTapTime < 400) { // Double tap detected within 400ms
      console.log('Double-tap detected - resetting model');
      
      // Reset to initial state
      setPosition([0, -0.5, -1]);
      setRotation([0, 0, 0]);
      setScale(initialScale);
      
      return true; // Indicate reset was triggered
    }
    setLastTapTime(now);
    return false; // No reset triggered
  };

  // Handle mesh loading event
  const handleMeshesLoaded = (event: NativeSyntheticEvent<ViroMeshLoadedEvent>) => {
    const loadedMeshNames = event.nativeEvent.meshNames;
    console.log('Meshes loaded:', loadedMeshNames);
    setMeshNames(loadedMeshNames);
    handleLoadMeshMaterials(loadedMeshNames);
  };

  return (
    <ViroARScene>
      <ViroAmbientLight color="#ffffff" intensity={200}/>
      <ViroSpotLight
        innerAngle={5}
        outerAngle={25}
        direction={[0, -1, 0]}
        position={[0, 3, 0]}
        color="#ffffff"
        intensity={500}
      />
      <ViroSpotLight
        innerAngle={5}
        outerAngle={25}
        direction={[0, 0, -1]}
        position={[0, 0, 3]}
        color="#ffffff"
        intensity={500}
      />
        
        <ViroNode
          scale={scale}
          position={position}
          rotation={rotation}
          onPinch={onPinch}
          onDrag={onDrag}
          onRotate={onRotate}
          dragType="FixedToWorld"
        >
          <Viro3DObject
            source={{ uri: modelUri }}
            type="GLB"
            scale={[1, 1, 1]}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            materials={materials}
            highAccuracyEvents={true}
            onError={handleError}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}

          />
        </ViroNode>
    </ViroARScene>
  );
};

// Main ViroARScreen component
const ViroARScreen = () => {
  const router = useRouter();
  const [localModelUri, setLocalModelUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const params = useLocalSearchParams();
  const modelUri = params.modelUri as string;
  const mounted = useRef(true);

  useEffect(() => {
    // Cleanup function
    return () => {
      mounted.current = false;
      console.log('ViroARScreen cleanup completed');
    };
  }, []);

  useEffect(() => {
    const initializeModel = async () => {
      if (!modelUri) {
        setError('No model URI provided');
        return;
      }

      try {
        setIsDownloading(true);
        setError(null);

        // Validate the model URI
        if (!modelUri.startsWith('file://') && !modelUri.startsWith('https://')) {
          throw new Error('Invalid model URI format');
        }

        // If the URI is already a local file, use it directly
        if (modelUri.startsWith('file://')) {
          const fileInfo = await FileSystem.getInfoAsync(modelUri);
          if (!fileInfo.exists) {
            throw new Error('Local model file not found');
          }
          if (mounted.current) {
            setLocalModelUri(modelUri);
          }
          return;
        }

        // Download the model if it's a remote URL
        const localUri = await downloadModel(modelUri, (progress) => {
          if (mounted.current) {
            setDownloadProgress(progress);
          }
        });

        if (mounted.current) {
          setLocalModelUri(localUri);
        }
      } catch (error) {
        console.error('Error initializing model:', error);
        if (mounted.current) {
          setError(getErrorMessage(error));
        }
      } finally {
        if (mounted.current) {
          setIsDownloading(false);
        }
      }
    };

    initializeModel();
  }, [modelUri]);

  const handleLoadStart = () => {
    if (mounted.current) {
      setIsLoading(true);
      setError(null);
    }
  };

  const handleLoadEnd = () => {
    if (mounted.current) {
      setIsLoading(false);
    }
  };

  const handleError = (error: unknown) => {
    console.error('AR Scene error:', error);
    if (mounted.current) {
      setError(getErrorMessage(error));
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (!localModelUri && !isDownloading && !error) {
    return (
      <View style={styles.container}>
        <LoadingIndicator message="Initializing AR..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>

      </View>
    );
  }

  return (
    <View style={styles.container}>
      {localModelUri && (
        <ViroARSceneNavigator
          autofocus={true}
          initialScene={{
            scene: () => (
              <ARScene 
                sceneNavigator={{ viroAppProps: { modelUri: localModelUri || '' } }}
                onError={handleError}
                onLoadStart={handleLoadStart}
                onLoadEnd={handleLoadEnd}
              />
            ),
          }}
          viroAppProps={{
            modelUri: localModelUri,
          }}
          style={styles.arView}
        />
      )}

      {/* Back button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      {(isLoading || isDownloading) && (
        <LoadingIndicator
          progress={isDownloading ? downloadProgress : undefined}
          message={isDownloading ? "Downloading model..." : "Loading model..."}
        />
      )}

    </View>
  );
};

export default ViroARScreen;

const styles = StyleSheet.create({


  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  arView: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: Dimensions.get('window').width * 0.8,
    maxWidth: 300,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  progressText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  errorContainer: {
    padding: 20,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    width: Dimensions.get('window').width * 0.8,
    maxWidth: 300,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
    padding: 5,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
    width: 120,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  button: {
    borderRadius: 10,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonIcon: {
    paddingRight: 8,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

});

import React, { useRef } from 'react';
import * as THREE from 'three';
import throttle from 'lodash/throttle';

import { CHASSIS_OBJECT_NAME, SENSOR_DISTANCE, SENSOR_HEIGHT } from './constants';
import SensorRay from './SensorRay';
import { useThree } from '@react-three/fiber';
import { CarMetaData, SensorValuesType } from '../types/car';
import { ON_SENSORS_THROTTLE_TIMEOUT } from '../constants/performance';

type SensorsProps = {
  sensorsNum: number,
  visibleSensors?: boolean,
  onSensors?: (sensors: SensorValuesType) => void,
};

const Sensors = (props: SensorsProps) => {
  const { visibleSensors = false, sensorsNum, onSensors = () => {} } = props;
  const obstacles = useRef<THREE.Object3D[]>([]);
  const sensorDistances = useRef<SensorValuesType>(new Array(sensorsNum).fill(undefined));
  const { scene } = useThree();

  const onSensorsCallback = () => {
    onSensors(sensorDistances.current);
  };

  const onSensorsCallbackThrottled = throttle(onSensorsCallback, ON_SENSORS_THROTTLE_TIMEOUT, {
    leading: true,
    trailing: true,
  });

  const onRay = (index: number, distance: number | undefined): void => {
    sensorDistances.current[index] = typeof distance === 'number'
      ? distance
      : null;
    onSensorsCallbackThrottled();
  };

  // @ts-ignore
  obstacles.current = scene.children
    .filter((object: THREE.Object3D) => object.type === 'Group')
    .map((object: THREE.Object3D) => object.getObjectByName(CHASSIS_OBJECT_NAME))
    .filter((object: THREE.Object3D | undefined) => {
      if (!object || !object.userData) {
        return false;
      }
      // @ts-ignore
      const userData: CarMetaData = object.userData;
      return userData?.isSensorObstacle;
    });

  const angleStep = 2 * Math.PI / sensorsNum;
  const sensorRays = new Array(sensorsNum).fill(null).map((_, index) => {
    return (
      <SensorRay
        key={index}
        index={index}
        from={[0, SENSOR_HEIGHT, 0]}
        to={[0, SENSOR_HEIGHT, SENSOR_DISTANCE]}
        angleX={angleStep * index}
        visible={visibleSensors}
        obstacles={obstacles.current}
        onRay={onRay}
      />
    );
  });

  return (
    <>
      {sensorRays}
    </>
  )
};

export default Sensors;

import styled from '@emotion/styled';
import {
  EntityName,
  FilterByDomain,
  HassEntityWithService,
  hsv2rgb,
  rgb2hs,
  useEntity,
  useLightColor,
} from '@hakit/core';
import {Point, motion, useDragControls} from 'framer-motion';
import {RefObject, useCallback, useEffect, useState} from 'react';
import {adjustRgb, getHSLColorFromCoord, getRelativePosition} from './utils';

export type PickerProps = {
  canvasRef: RefObject<HTMLCanvasElement>;
  entities: FilterByDomain<EntityName, 'light'>[];
  hovered?: boolean;
  active?: boolean;
  display?: boolean;
  lightColors: ReturnType<typeof useLightColor>;
  onClick?: (entities: HassEntityWithService<'light'>[]) => void;
  onChangeApplied?: (
    entities: HassEntityWithService<'light'>[],
    color: [number, number, number]
  ) => void;
  onChange?: (
    entities: HassEntityWithService<'light'>[],
    color: [number, number, number]
  ) => void;
};

export function Picker(props: PickerProps) {
  const {
    canvasRef,
    entities,
    hovered = false,
    active = false,
    lightColors,
    onClick,
    onChange,
    onChangeApplied,
  } = props;

  console.log('entities', entities);
  const lights =
    entities &&
    entities.map(entity => {
      console.log('getEntity started', entity);
      const test = useEntity(entity);
      console.log('getEntity passed', test);
      return test;
    });
  const [color, setColor] = useState<[number, number, number]>(
    lights[0]?.attributes.rgb_color ?? [255, 255, 255]
  );
  const [position, setPosition] = useState({x: -1, y: -1});
  const dragControls = useDragControls();

  const getCoordFromHSLColor = useCallback(
    ([hue, saturation]: [number, number]) => {
      if (!canvasRef.current) return {x: 0, y: 0};
      const phi = (hue / 360) * 2 * Math.PI;
      const sat = Math.min(saturation, 1);
      const x = Math.cos(phi) * sat;
      const y = Math.sin(phi) * sat;
      const canvas = canvasRef.current;
      const {x: canvasX, y: canvasY} = canvas.getBoundingClientRect();
      const halfWidth = canvas.clientWidth / 2;
      const halfHeight = canvas.clientHeight / 2;

      return {
        x: canvasX + halfWidth + halfWidth * x,
        y: canvasY + halfHeight + halfHeight * y,
      };
    },
    []
  );

  const onDrag = useCallback(
    (
      _: MouseEvent | TouchEvent | PointerEvent | null,
      info: {point: Point}
    ) => {
      if (!canvasRef.current) return;
      onClick && onClick(lights);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (dragControls as any).componentControls.forEach((entry: any) => {
        const radius = canvasRef.current!.clientWidth / 2;
        const x = entry.getAxisMotionValue('x').get() / radius;
        const y = entry.getAxisMotionValue('y').get() / radius;
        const distanceFromMiddle = Math.hypot(x, y);

        if (distanceFromMiddle > 1 || distanceFromMiddle < 0) {
          const angle = Math.atan2(y, x);
          entry.getAxisMotionValue('x').set(radius * Math.cos(angle) - 4);
          entry.getAxisMotionValue('y').set(radius * Math.sin(angle) - 4);
        }
      });

      setPosition(info.point);
    },
    []
  );

  const getColorFromCoord = useCallback(
    (x: number, y: number) => getHSLColorFromCoord(x, y),
    []
  );

  useEffect(() => {
    if (position.x === -1 || position.y === -1 || !canvasRef.current) return;

    const {x, y} = getRelativePosition(canvasRef, position.x, position.y);
    const {hue, saturation} = getColorFromCoord(x, y);

    const color = adjustRgb(
      hsv2rgb([hue, saturation, lightColors.colorBrightness ?? 255]),
      lightColors.white,
      lightColors.coolWhite,
      lightColors.warmWhite
    );
    setColor(color);
    onChange && onChange(lights, color);

    const {clientWidth, clientHeight} = canvasRef.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (dragControls as any).componentControls.forEach((entry: any) => {
      entry.getAxisMotionValue('x').set(x * (clientWidth / 2));
      entry.getAxisMotionValue('y').set(y * (clientHeight / 2));
    });
  }, [position]);

  useEffect(() => {
    setPosition(getCoordFromHSLColor(rgb2hs(color)));
  }, []);

  return (
    <PickerContainer
      drag
      dragControls={dragControls}
      dragMomentum={false}
      onClick={() => onClick && onClick(lights)}
      onDrag={onDrag}
      onDragEnd={() => onChangeApplied && onChangeApplied(lights, color)}
      whileTap={{scale: 1.5, zIndex: 10, cursor: 'grabbing'}}
      whileHover={{scale: 1.2, zIndex: 10, cursor: 'grab'}}
    >
      {active ? (
        <ActivePickerMark
          style={{
            border: hovered ? '2px solid white' : '2px solid black',
            backgroundColor: `rgb(${color.join(',')})`,
          }}
        ></ActivePickerMark>
      ) : (
        <PickerMark
          style={{
            border: hovered ? '2px solid white' : '2px solid black',
            backgroundColor: `rgb(${color.join(',')})`,
          }}
        />
      )}
    </PickerContainer>
  );
}

const PickerContainer = styled(motion.div)`
  position: absolute;
  top: calc(50% - 12px);
  left: calc(50% - 12px);
  width: 32px;
  height: 32px;
`;

const ActivePickerMark = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-sizing: border-box;
  transform: rotate(45deg) translate(-50%, -50%);
  border-bottom-right-radius: 0;
  border: 2px solid white;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.15);
`;

const PickerMark = styled.div`
  margin: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.15);
`;

import {useRef, useCallback, useEffect} from 'react';
import styled from '@emotion/styled';
import {useEntity, useLightColor} from '@hakit/core';
import {drawColorWheel} from './utils';
import {motion} from 'framer-motion';
import {Picker} from '../../Modal/Type/LightModal/Picker';
import type {
  EntityName,
  FilterByDomain,
  HassEntityWithService,
} from '@hakit/core';

export type ColorPickerProps = {
  entities: FilterByDomain<EntityName, 'light'>[];
  hoverEntities: FilterByDomain<EntityName, 'light'>[];
  activeEntities: FilterByDomain<EntityName, 'light'>[];
  lightColors: ReturnType<typeof useLightColor>;
  onEntitiesClick?: (entities: HassEntityWithService<'light'>[]) => void;
  onEntitiesChange?: (
    entities: HassEntityWithService<'light'>[],
    color: [number, number, number]
  ) => void;
  onEntitiesChangeApplied?: (
    entities: HassEntityWithService<'light'>[],
    color: [number, number, number]
  ) => void;
};

export function ColorPicker(props: ColorPickerProps) {
  const {
    entities,
    hoverEntities,
    activeEntities,
    lightColors,
    onEntitiesClick,
    onEntitiesChange,
    onEntitiesChangeApplied,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateColorWheel = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    drawColorWheel(ctx);
  }, []);

  useEffect(() => {
    generateColorWheel();
  }, [generateColorWheel]);

  //let renderActive = false;

  return (
    <Container>
      <Canvas ref={canvasRef} width="400px" height="400px" />
      {entities.map(entity => {
        const active = activeEntities.includes(entity);
        //if (!renderActive) renderActive = true;

        return (
          <Picker
            key={entity}
            canvasRef={canvasRef}
            entity={useEntity(entity)}
          />
        );
      })}
    </Container>
  );
}

const Container = styled(motion.div)`
  position: relative;
  height: '45vh';
  max-height: 320px;
  max-width: 320px;
  min-height: 200px;
  min-width: 200px;
`;

const Canvas = styled.canvas`
  object-fit: contain;
  border-radius: 50%;
  cursor: pointer;
  width: 100%;
  height: 100%;
`;

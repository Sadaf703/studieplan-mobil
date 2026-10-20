import React, { useEffect, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import type { CatName } from './model';
import drawings from '../assets/cats.json';

export function PixelCat({ cat, size = 100, bow = false, party = 0, reduced = false }: { cat: CatName; size?: number; bow?: boolean; party?: number; reduced?: boolean }) {
  const [hop] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced || !party) { hop.setValue(0); return; }
    const motion = Animated.sequence(Array.from({ length: 3 }, () => Animated.sequence([
      Animated.timing(hop, { toValue: -12, duration: 170, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(hop, { toValue: 0, duration: 200, useNativeDriver: true }),
    ])));
    motion.start(); return () => motion.stop();
  }, [party, reduced, hop]);
  return <Animated.View accessibilityLabel="Pikselkatt" style={{ width: size, height: size, transform: [{ translateY: hop }] }}>
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {drawings[cat].map((r, i) => <Rect key={i} x={r.x} y={r.y} width={1} height={1} fill={r.fill} />)}
    </Svg>
    {bow && <View style={{ position: 'absolute', top: size * .12, right: size * .13 }}><Text style={{ fontSize: size * .22 }}>🎀</Text></View>}
  </Animated.View>;
}

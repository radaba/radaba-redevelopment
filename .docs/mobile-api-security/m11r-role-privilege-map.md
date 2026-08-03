# Role and privilege map

Proven profile roles are `Rigger`, `Coordinator`, `RNO`, and `Administrator`. Comparisons are case-insensitive, but unknown or absent roles deny in enforce mode. There is no implicit super-administrator or hidden bypass.

| Role | Assignment | Cell/Sector | Profile |
|---|---|---|---|
| Rigger | own records only | relationships rooted in own Assignment | self |
| Coordinator / RNO | records whose coordinator/RNO email matches | relationships rooted in that scope | self |
| Administrator | explicit route-policy override | explicit route-policy override | self or another profile |

Existing privilege records describe application/menu capabilities; investigation did not prove stable mobile route privilege codes. M11R therefore does not invent codes or schema. Route policy uses proven roles plus object relationships. A future privilege-code gate requires separately approved evidence and fixtures.
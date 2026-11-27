# Changelog

IITC plugin: Portals list

## 0.5.51

- Collapse the Visit/Cap·Scout pie to the clicked legend, matching the other pies

## 0.5.50

- Label mod chips with rarity and type short names

## 0.5.49

- Document query operators, factions, lists and flags in the help dialog

## 0.5.48

- Keep the window at least wide enough for three pies and their legends, and keep the action bar in place when the list is empty

## 0.5.47

- Filter the detail list with a boolean query beside Export CSV

## 0.5.46

- Fetch full portal details for all selected portals before CSV export

## 0.5.45

- Avoid duplicate OK/确定 buttons on the CSV export dialog

## 0.5.44

- Trim unused helpers, merge pie/metric helpers, and shrink the changelog

## 0.5.43

- Add a Guid column as the second CSV export column

## 0.5.42

- Keep Cap/Visit/Un visit/Scout/Un scout labels in English

## 0.5.41

- Keep Portals list entry, Visit/Cap·Scout pie title, table and CSV headers in English

## 0.5.40

- Localize buttons, titles and UI copy for Chinese or English system language

## 0.5.39

- Hide Cap/Visit and Scout legends when there are no portals, matching the other pies

## 0.5.38

- Center Cap/Visited/Scout text in the V/C and S detail columns

## 0.5.37

- Split Visit/Cap/Scout into a dual-ring pie with Cap/Visit/Unvisit and Scout/Unscout legends

## 0.5.36

- Shrink the CSV textarea so it stays above the Save/OK button row

## 0.5.35

- Make the CSV export textarea resize with the dialog

## 0.5.34

- Swap OK and Save button order on the CSV export dialog

## 0.5.33

- Remove the Close button from the CSV export dialog

## 0.5.32

- Keep CSV export dialog buttons right-aligned

## 0.5.31

- Increase spacing between CSV export dialog buttons

## 0.5.30

- Add save-to-file on the CSV export dialog

## 0.5.29

- Refresh bookmark stars on the map immediately, drop success alerts, and show CSV in a copy dialog

## 0.5.28

- Add row checkboxes plus bookmark, Draw Tools marker and CSV export actions

## 0.5.27

- Use the same Neutral color for Neutral, 未访问, L0 legends and matching detail cells

## 0.5.26

- Revert the level legend to a single column

## 0.5.25

- Trim redundant helpers, comments and changelog bulk

## 0.5.24

- Show the level legend in two columns and let the detail table grow with the dialog height

## 0.5.23

- Right-align count and percent in each stats legend color bar

## 0.5.22

- Keep only a vertical scrollbar on the detail list

## 0.5.21

- Put each stats legend to the left of its pie chart to free vertical space for the detail list

## 0.5.20

- Show unclaimed portals as L0 in the detail list to match the level pie

## 0.5.19

- Include unclaimed portals in the level pie and let level legend clicks filter the detail list

## 0.5.18

- Do not auto-show the Only In Polygons tooltip when the dialog opens

## 0.5.17

- Size the dialog to the detail table width instead of opening nearly full screen

## 0.5.16

- Keep the Scout header fully visible by widening the column and dialog fit margin

## 0.5.15

- Widen the Scout column by 20px

## 0.5.14

- Tighten portal table column widths and truncate portal names to about 20 characters

## 0.5.13

- Show total shield mitigation in Shields and list shield mods under Mods

## 0.5.12

- Load portal details only for currently shown and visible rows

## 0.5.11

- Remove unused filter-bar counts, reverse filters and leftover CSS

## 0.5.10

- Update rows by guid, refresh statistics once per load batch, and sort or filter without rebuilding the table

## 0.5.9

- Replace the filter bars and level table with colored pie legends

## 0.5.8

- Add faction, visit status and level pie charts to the statistics section

## 0.5.7

- Show shields, resonators, mods and owner as soon as portal details arrive

## 0.5.6

- Write portal details into the list row as soon as portalDetailLoaded fires

## 0.5.5

- Move help to a title-bar button and update each detail row as soon as its data arrives

## 0.5.4

- Refresh only visible detail rows and open wide enough to show the detail table

## 0.5.3

- Load full details for occupied portals when the list opens

## 0.5.2

- Color the Visited, Cap and Scout summary bars to match their detail cells

## 0.5.1

- Scroll the detail table on its own and color visited, captured and scout cells

## 0.5.0

- Merge Portal counts into this window as a statistics table above the portal details

## 0.4.9

- Call this plugin's own getPortals so Only In Polygons can see its helper

## 0.4.8

- Add an Only In Polygons checkbox that keeps portals inside Draw tools polygons

## 0.4.7

- Publish abbreviate so a later portalTable can call it

## 0.4.5

- Refactoring: fix eslint

## 0.4.4

- Version upgrade due to a change in the wrapper: plugin icons are now vectorized

## 0.4.3

- Moved "portalApGainMaths" function from core to portalList plugin
- IITC.toolbox API is used to create plugin buttons

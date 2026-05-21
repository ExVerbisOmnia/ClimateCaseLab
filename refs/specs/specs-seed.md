We need to create a landing page for the project, to host one interactive map and an interactive dashboard featuring the catalytic cases. We have some mockups inside /home/gusrodgs/workspace/proj/phdMutley/climatecaselab, that feature the functionalities we want. 

The site's prototype goes as follows:

1. Landing
   
   1. About this project
      
      1. A description of what is being showcased, its origin and purpose.
   
   2. Methodology
      
      1. A brief description of the methodolgy applied to the research project.
   
   3. Collaboration
      
      1. An open call for submitions by visitors of any errors or improvements identified.

2. Interactive Map

3. Catalytic Cases
   
   = Navigation and Structure
   
   The navigation of the site is based in tabs (uppertabs and subtabs): users land in the home page, the "landing" uppertab, the first one, which is subdivided in three subtabs inside it: "about this project", "methodology", "colaboration". The subtabs are sticky to the page, as a fixed header, as well as the 3 uppertabs. Scrolling down shifts the highlighted subtab as the user positions the content of the page to be the content relative to the subtab. Clicling in a subtab smoothly scrolls the page to the section where its content is featured. 
   
   The navigation between uppertabs is based on a slide of the content under the uppertab, each uppertab's content positioned as they are placed side to side, like the behaviour of switching desktop workspaces. 
   
   = The interactive map
   
   Its functionalities should be based upon the mockup in /climatecaselab/refs/climate_litigation_citation_map_v19_05_2026-3.html; featuring: 

4. Left pane: a country multi-selector; the toggle of citation direction; and the statistics based on the selected countries; 

5. Middle pane: the interactive map, which renders lines connecting countries that cite each other, based on the direction toggle setup. The map should be interactive, as to allow zoom in and out in a manner that the connecting lines remain visible as being the same size - they should render in the same thickness despite the zoom level, as should the circles that pinned atop the countries selected or implied by the citation connections. 

6. Right pane: a list of cards (dynamic in size) featuring the cases containing citations, each card containing: Name of case, country of the case, citations count, citations list. The name of the case inside the card should be an highlitable hyperlink that leads to that case's page inside the sabin site (as available the link inside the local database).
   
   = Catalytic Cases
   
   An interactive dashboard featuring the informations pertaining or relating to the catalytic cases (top five cited cases) as per the local database. Each catalytic case should have its card in the dashboard, with interactive features as to display more information and reveal details about the case and its related entities (countries, citing cases). 
   
   Take the mockup at /climatecaselab/refs/Figure_X2_Catalytic_Cases.html and expand it, leveragin on all the relevant information we have on each catalytic case and its connections to other entities. In the card, there should be a square arrow button featuring an hyperlink to the case's page on the sabin site. 

= General UI and Aesthetic

the webapp is host to an academic project, in the field of international climate law, and its aesthetic should be consistent with that: Minimalistic and lean, elegant, high color contrast, serifed font family for the titles and subtitles, and a square-ish font family for the paragraphs. 

Color palette shall be cold, featuring colors in the blue and lilac spectrum, kind of pastel, with some bright shades of light orange and red for accent colors - also pastel-ish. 

There should be a dark/bright theme toggle.

Dark theme: grayscale, not too dark, with the background grays slightly tilted towards the blueish region of the color spectrum. Paragraph texts should be off-white while titles and subtiltes should abide by the color pallette scheme described above.

Bright theme: bright off-white, with the shade of the offwhite backgroundns slightly tilted towards a dessaturated yellow. Pargraph texts should be hard-dark gray, almost balck, and subtitles and titles and other colors should abide by the color palette described above.

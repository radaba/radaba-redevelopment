# Image write failure matrix

| Failure point | Observable state |
| --- | --- |
| Assignment read | No Cell/image write; raw 500. |
| Missing Assignment with height | Throws before Cell/image write. |
| Cell query/write | Earlier Cell writes may remain; later Cells and image are not written in the compatibility service; raw 500. |
| Image query/write | All prior Cell fan-out remains; raw 500. |
| Duplicate image update | Each matching child is updated; partial duplicate updates can remain on failure. |

Legacy Cell update callbacks were not awaited and ignored their errors. App
Router cannot safely reproduce post-response callback races; M8R awaits each
operation and documents this conservative timing gap without making writes atomic.

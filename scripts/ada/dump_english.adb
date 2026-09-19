with Ada.Text_IO; use Ada.Text_IO;
with Ada.Strings.Fixed; use Ada.Strings.Fixed;
with Ada.Strings; use Ada.Strings;
with Latin_Utils.Inflections_Package; use Latin_Utils.Inflections_Package;
with Words_Engine.English_Support_Package; use Words_Engine.English_Support_Package;
procedure Dump_English is
   F : Ewds_Direct_Io.File_Type;
   R : Ewds_Record;
   Tab : constant Character := Character'Val (9);
   function Image (N : Integer) return String is (Trim (Integer'Image (N), Both));
begin
   Ewds_Direct_Io.Open (F, Ewds_Direct_Io.In_File, "EWDSFILE.GEN");
   for I in 1 .. Ewds_Direct_Io.Size (F) loop
      Ewds_Direct_Io.Read (F, R, I);
      Put_Line (Trim (R.W, Both) & Tab & Trim (R.Aux, Both) & Tab & Image (R.N) & Tab &
        Part_Of_Speech_Type'Image (R.Pofs) & Tab & Frequency_Type'Image (R.Freq) & Tab &
        Image (R.Semi) & Tab & Image (R.Kind) & Tab & Image (R.Rank));
   end loop;
   Ewds_Direct_Io.Close (F);
end Dump_English;

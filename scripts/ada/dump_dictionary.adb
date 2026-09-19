with Ada.Text_IO; use Ada.Text_IO;
with Ada.Strings.Fixed; use Ada.Strings.Fixed;
with Latin_Utils.Dictionary_Package; use Latin_Utils.Dictionary_Package;
with Support_Utils.Dictionary_Form;

procedure Dump_Dictionary is
   F : Dict_IO.File_Type;
   D : Dictionary_Entry;
   use type Dict_IO.Count;
begin
   Dict_IO.Open (F, Dict_IO.In_File, "DICTFILE.GEN");
   for I in 1 .. Dict_IO.Size (F) loop
      Dict_IO.Read (F, D, I);
      Put_Line (Trim (Dict_IO.Count'Image (I), Ada.Strings.Both) &
                Character'Val (9) & Support_Utils.Dictionary_Form (D));
   end loop;
   Dict_IO.Close (F);
end Dump_Dictionary;
